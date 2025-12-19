const DeleteReplyUseCase = require("../DeleteReplyUseCase")
const ReplyRepository = require("../../../Domains/replies/ReplyRepository")
const CommentRepository = require("../../../Domains/comments/CommentRepository")
const ThreadRepository = require("../../../Domains/threads/ThreadRepository")

describe("DeleteReplyUseCase", () => {
  it("should orchestrating the delete reply action correctly", async () => {
    // Arrange
    const useCasePayload = {
      threadId: "thread-123",
      commentId: "comment-123",
      replyId: "reply-123",
      owner: "user-123",
    }

    /** creating dependency of use case */
    const mockReplyRepository = new ReplyRepository()
    const mockCommentRepository = new CommentRepository()
    const mockThreadRepository = new ThreadRepository()

    /** mocking needed function */
    mockThreadRepository.verifyThreadAvailability = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    mockCommentRepository.verifyCommentAvailability = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    mockReplyRepository.verifyReplyAvailability = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    mockReplyRepository.verifyReplyOwner = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    mockReplyRepository.deleteReply = jest
      .fn()
      .mockImplementation(() => Promise.resolve())

    /** creating use case instance */
    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    })

    // Action
    await deleteReplyUseCase.execute(useCasePayload)

    // Assert
    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith(
      useCasePayload.threadId
    )
    expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(
      useCasePayload.commentId
    )
    expect(mockReplyRepository.verifyReplyAvailability).toBeCalledWith(
      useCasePayload.replyId
    )
    expect(mockReplyRepository.verifyReplyOwner).toBeCalledWith(
      useCasePayload.replyId,
      useCasePayload.owner
    )
    expect(mockReplyRepository.deleteReply).toBeCalledWith(
      useCasePayload.replyId
    )
  })
})
