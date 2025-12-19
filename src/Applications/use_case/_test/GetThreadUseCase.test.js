const GetThreadUseCase = require("../GetThreadUseCase")
const ThreadRepository = require("../../../Domains/threads/ThreadRepository")
const CommentRepository = require("../../../Domains/comments/CommentRepository")
const ReplyRepository = require("../../../Domains/replies/ReplyRepository")
const LikeRepository = require("../../../Domains/likes/LikeRepository")
const ThreadDetail = require("../../../Domains/threads/entities/ThreadDetail")

describe("GetThreadUseCase", () => {
  it("should orchestrating the get thread action correctly", async () => {
    // Arrange
    const useCasePayload = {
      threadId: "thread-123",
    }

    const expectedThread = {
      id: "thread-123",
      title: "A Thread",
      body: "A Thread Body",
      date: "2021-08-08T07:19:09.775Z",
      username: "dicoding",
    }

    const expectedComments = [
      {
        id: "comment-123",
        username: "johndoe",
        date: "2021-08-08T07:22:33.555Z",
        content: "A Comment",
        is_deleted: false,
      },
      {
        id: "comment-456",
        username: "dicoding",
        date: "2021-08-08T07:26:21.338Z",
        content: "Another Comment",
        is_deleted: true,
      },
    ]

    const expectedReplies = [
      {
        id: "reply-123",
        comment_id: "comment-123",
        content: "A Reply",
        date: "2021-08-08T07:59:18.982Z",
        username: "dicoding",
        is_deleted: false,
      },
      {
        id: "reply-456",
        comment_id: "comment-123",
        content: "Another Reply",
        date: "2021-08-08T08:07:01.522Z",
        username: "johndoe",
        is_deleted: true,
      },
    ]

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository()
    const mockCommentRepository = new CommentRepository()
    const mockReplyRepository = new ReplyRepository()
    const mockLikeRepository = new LikeRepository()

    /** mocking needed function */
    mockThreadRepository.verifyThreadAvailability = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    mockThreadRepository.getThreadById = jest
      .fn()
      .mockImplementation(() => Promise.resolve(expectedThread))
    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(expectedComments))
    mockReplyRepository.getRepliesByCommentId = jest
      .fn()
      .mockImplementation((commentId) =>
        Promise.resolve(
          expectedReplies.filter((reply) => reply.comment_id === commentId)
        )
      )
    mockLikeRepository.getLikeCountByCommentId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(0))

    /** creating use case instance */
    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      likeRepository: mockLikeRepository,
    })

    // Action
    const thread = await getThreadUseCase.execute(useCasePayload)

    // Assert
    expect(thread).toEqual(
      new ThreadDetail({
        id: expectedThread.id,
        title: expectedThread.title,
        body: expectedThread.body,
        date: expectedThread.date,
        username: expectedThread.username,
        comments: [
          {
            id: "comment-123",
            username: "johndoe",
            date: "2021-08-08T07:22:33.555Z",
            content: "A Comment",
            likeCount: 0,
            replies: [
              {
                id: "reply-123",
                content: "A Reply",
                date: "2021-08-08T07:59:18.982Z",
                username: "dicoding",
              },
              {
                id: "reply-456",
                content: "**balasan telah dihapus**",
                date: "2021-08-08T08:07:01.522Z",
                username: "johndoe",
              },
            ],
          },
          {
            id: "comment-456",
            username: "dicoding",
            date: "2021-08-08T07:26:21.338Z",
            content: "**komentar telah dihapus**",
            likeCount: 0,
            replies: [],
          },
        ],
      })
    )
    expect(mockThreadRepository.verifyThreadAvailability).toBeCalledWith(
      useCasePayload.threadId
    )
    expect(mockThreadRepository.getThreadById).toBeCalledWith(
      useCasePayload.threadId
    )
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(
      useCasePayload.threadId
    )
  })
})
