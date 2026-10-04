function createAuditAdminAction({ securityLog }) {
  return function auditAdminAction(req, res, next) {
    res.on('finish', () => {
      securityLog('ADMIN_ACTION', {
        adminId: req.user?.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ip: req.ip,
        payload: req.validated?.body,
      });
    });
    next();
  };
}

module.exports = createAuditAdminAction;
