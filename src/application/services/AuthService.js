const AppError = require('../../shared/errors/AppError');
const { toUserDto } = require('../dto/userDto');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

class AuthService {
  constructor({
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenProvider,
    securityLog,
    clock,
    idGenerator,
  }) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordHasher = passwordHasher;
    this.tokenProvider = tokenProvider;
    this.securityLog = securityLog;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async register(input) {
    const email = input.email.toLowerCase();
    const existingUser = await this.userRepository.findByEmailWithSecrets(email);
    if (existingUser) {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Пользователь с таким email уже существует');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({ email, passwordHash });
    return toUserDto(user);
  }

  async login(input, requestMeta) {
    const email = input.email.toLowerCase();
    const user = await this.userRepository.findByEmailWithSecrets(email);

    if (!user) {
      await this.passwordHasher.compareWithDummy(input.password);
      this.securityLog('LOGIN_FAILED', { email, reason: 'invalid_credentials', ...requestMeta });
      throw this.invalidCredentialsError();
    }

    const now = this.clock.now();
    if (user.lockUntil && user.lockUntil > now) {
      this.securityLog('LOGIN_BLOCKED', { userId: user.id, email, lockUntil: user.lockUntil, ...requestMeta });
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Аккаунт временно заблокирован. Повторите попытку позже');
    }

    if (user.lockUntil && user.lockUntil <= now) {
      await user.update({ failedAttempts: 0, lockUntil: null });
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      const failedAttempts = user.failedAttempts + 1;
      const lockUntil = failedAttempts >= MAX_FAILED_ATTEMPTS
        ? this.clock.addMinutes(now, LOCK_MINUTES)
        : null;

      await user.update({ failedAttempts, lockUntil });
      this.securityLog('LOGIN_FAILED', {
        userId: user.id,
        email,
        failedAttempts,
        accountLocked: Boolean(lockUntil),
        ...requestMeta,
      });
      throw this.invalidCredentialsError();
    }

    await user.update({ failedAttempts: 0, lockUntil: null });
    const tokens = await this.issueTokenPair(user, requestMeta);
    return { user: toUserDto(user), ...tokens };
  }

  async refresh(rawToken, requestMeta) {
    if (!rawToken) throw new AppError(401, 'REFRESH_REQUIRED', 'Требуется refresh-токен');

    let payload;
    try {
      payload = this.tokenProvider.verifyRefreshToken(rawToken);
    } catch {
      this.securityLog('INVALID_REFRESH_TOKEN', requestMeta);
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Недействительный refresh-токен');
    }

    const storedToken = await this.refreshTokenRepository.findByTokenId(payload.jti);
    if (!storedToken || storedToken.tokenHash !== this.tokenProvider.hashToken(rawToken)) {
      this.securityLog('REFRESH_TOKEN_NOT_FOUND', { userId: payload.sub, tokenId: payload.jti, ...requestMeta });
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Недействительный refresh-токен');
    }

    if (storedToken.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(payload.sub, this.clock.now());
      this.securityLog('REFRESH_TOKEN_REUSE', { userId: payload.sub, tokenId: payload.jti, ...requestMeta });
      throw new AppError(401, 'REFRESH_TOKEN_REUSED', 'Сессия отозвана');
    }

    if (storedToken.expiresAt <= this.clock.now()) {
      throw new AppError(401, 'REFRESH_EXPIRED', 'Срок действия refresh-токена истёк');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Недействительный refresh-токен');

    await storedToken.update({ revokedAt: this.clock.now() });
    const tokens = await this.issueTokenPair(user, requestMeta);
    return { user: toUserDto(user), ...tokens };
  }

  async logout(rawToken) {
    if (!rawToken) return;
    try {
      const payload = this.tokenProvider.verifyRefreshToken(rawToken);
      const storedToken = await this.refreshTokenRepository.findByTokenId(payload.jti);
      if (storedToken && !storedToken.revokedAt) {
        await storedToken.update({ revokedAt: this.clock.now() });
      }
    } catch {
      // Logout remains idempotent and does not reveal token validity.
    }
  }

  async issueTokenPair(user, requestMeta) {
    const tokenId = this.idGenerator.newId();
    const accessToken = this.tokenProvider.signAccessToken(user);
    const refreshToken = this.tokenProvider.signRefreshToken(user, tokenId);

    await this.refreshTokenRepository.create({
      id: tokenId,
      userId: user.id,
      tokenHash: this.tokenProvider.hashToken(refreshToken),
      expiresAt: this.tokenProvider.refreshExpiryDate(),
      ipAddress: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });

    return { accessToken, refreshToken };
  }

  invalidCredentialsError() {
    return new AppError(401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');
  }
}

module.exports = AuthService;
