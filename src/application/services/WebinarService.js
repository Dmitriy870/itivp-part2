const { toWebinarDto } = require('../dto/learningDto');

class WebinarService {
  constructor({ webinarRepository, clock }) {
    this.webinarRepository = webinarRepository;
    this.clock = clock;
  }

  async listUpcoming(courseId) {
    const webinars = await this.webinarRepository.findUpcoming(this.clock.now(), courseId);
    return webinars.map(toWebinarDto);
  }
}

module.exports = WebinarService;
