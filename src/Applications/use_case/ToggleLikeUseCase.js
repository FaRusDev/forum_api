class ToggleLikeUseCase {
  constructor({ commentRepository, likeRepository }) {
    this._commentRepository = commentRepository;
    this._likeRepository = likeRepository;
  }

  async execute(useCasePayload) {
    const { commentId, owner } = useCasePayload;

    await this._commentRepository.verifyCommentExists(commentId);

    const isLiked = await this._likeRepository.verifyLikeExists(commentId, owner);

    if (isLiked) {
      await this._likeRepository.deleteLike(commentId, owner);
    } else {
      await this._likeRepository.addLike(commentId, owner);
    }
  }
}

module.exports = ToggleLikeUseCase;
