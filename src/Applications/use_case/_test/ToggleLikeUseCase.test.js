const ToggleLikeUseCase = require('../ToggleLikeUseCase');
const LikeRepository = require('../../../Domains/likes/LikeRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');

describe('ToggleLikeUseCase', () => {
  it('should orchestrate the add like action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockLikeRepository = new LikeRepository();
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadAvailability = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.verifyLikeExists = jest.fn()
      .mockImplementation(() => Promise.resolve(false));
    mockLikeRepository.addLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleLikeUseCase = new ToggleLikeUseCase({
      likeRepository: mockLikeRepository,
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    await toggleLikeUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadAvailability)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentAvailability)
      .toHaveBeenCalledWith(useCasePayload.commentId);
    expect(mockLikeRepository.verifyLikeExists)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
    expect(mockLikeRepository.addLike)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
  });

  it('should orchestrate the delete like action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockLikeRepository = new LikeRepository();
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadAvailability = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.verifyLikeExists = jest.fn()
      .mockImplementation(() => Promise.resolve(true));
    mockLikeRepository.deleteLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleLikeUseCase = new ToggleLikeUseCase({
      likeRepository: mockLikeRepository,
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    await toggleLikeUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadAvailability)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentAvailability)
      .toHaveBeenCalledWith(useCasePayload.commentId);
    expect(mockLikeRepository.verifyLikeExists)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
    expect(mockLikeRepository.deleteLike)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
  });
});
