const AddReplyUseCase = require("../AddReplyUseCase")
const ReplyRepository = require("../../../Domains/replies/ReplyRepository")
const CommentRepository = require("../../../Domains/comments/CommentRepository")
const ThreadRepository = require("../../../Domains/threads/ThreadRepository")
const AddReply = require("../../../Domains/replies/entities/AddReply")
const AddedReply = require("../../../Domains/replies/entities/AddedReply")

describe("AddReplyUseCase", () => {
  it("should orchestrating the add reply action correctly", async () => {
    // Arrange
    const useCasePayload = {
      content: "A Reply",
      commentId: "comment-123",
      threadId: "thread-123",
      owner: "user-123",
    }

    const expectedAddedReply = new AddedReply({
      id: "reply-123",
      content: useCasePayload.content,
      owner: useCasePayload.owner,
    })

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
    mockReplyRepository.addReply = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new AddedReply({
            id: "reply-123",
            content: "A Reply",
            owner: "user-123",
          })
        )
      )

    /** creating use case instance */
    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    })

    // Action
    const addedReply = await addReplyUseCase.execute(useCasePayload)

    // Assert
    expect(addedReply).toStrictEqual(expectedAddedReply)
    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith(
      useCasePayload.threadId
    )
    expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(
      useCasePayload.commentId
    )
    expect(mockReplyRepository.addReply).toBeCalledWith(
      new AddReply({
        content: useCasePayload.content,
        commentId: useCasePayload.commentId,
        threadId: useCasePayload.threadId,
        owner: useCasePayload.owner,
      })
    )
  })
})
