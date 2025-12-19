const RepliesTableTestHelper = require("../../../../tests/RepliesTableTestHelper")
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper")
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper")
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper")
const NotFoundError = require("../../../Commons/exceptions/NotFoundError")
const AuthorizationError = require("../../../Commons/exceptions/AuthorizationError")
const AddReply = require("../../../Domains/replies/entities/AddReply")
const AddedReply = require("../../../Domains/replies/entities/AddedReply")
const pool = require("../../database/postgres/pool")
const ReplyRepositoryPostgres = require("../ReplyRepositoryPostgres")

describe("ReplyRepositoryPostgres", () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable()
    await CommentsTableTestHelper.cleanTable()
    await ThreadsTableTestHelper.cleanTable()
    await UsersTableTestHelper.cleanTable()
  })

  afterAll(async () => {
    await pool.end()
  })

  describe("addReply function", () => {
    it("should persist add reply and return added reply correctly", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      await CommentsTableTestHelper.addComment({ id: "comment-123" })
      const addReply = new AddReply({
        content: "A Reply",
        commentId: "comment-123",
        threadId: "thread-123",
        owner: "user-123",
      })
      const fakeIdGenerator = () => "123"
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(
        pool,
        fakeIdGenerator
      )

      // Action
      await replyRepositoryPostgres.addReply(addReply)

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById("reply-123")
      expect(replies).toHaveLength(1)
    })

    it("should return added reply correctly", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      await CommentsTableTestHelper.addComment({ id: "comment-123" })
      const addReply = new AddReply({
        content: "A Reply",
        commentId: "comment-123",
        threadId: "thread-123",
        owner: "user-123",
      })
      const fakeIdGenerator = () => "123"
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(
        pool,
        fakeIdGenerator
      )

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(addReply)

      // Assert
      expect(addedReply).toStrictEqual(
        new AddedReply({
          id: "reply-123",
          content: "A Reply",
          owner: "user-123",
        })
      )
    })
  })

  describe("verifyReplyAvailability function", () => {
    it("should throw NotFoundError when reply not available", async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {})

      // Action & Assert
      await expect(
        replyRepositoryPostgres.verifyReplyAvailability("reply-123")
      ).rejects.toThrowError(NotFoundError)
    })

    it("should not throw NotFoundError when reply available", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      await CommentsTableTestHelper.addComment({ id: "comment-123" })
      await RepliesTableTestHelper.addReply({ id: "reply-123" })
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {})

      // Action & Assert
      await expect(
        replyRepositoryPostgres.verifyReplyAvailability("reply-123")
      ).resolves.not.toThrowError(NotFoundError)
    })
  })

  describe("verifyReplyOwner function", () => {
    it("should throw AuthorizationError when user is not the owner", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      await CommentsTableTestHelper.addComment({ id: "comment-123" })
      await RepliesTableTestHelper.addReply({
        id: "reply-123",
        owner: "user-123",
      })
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {})

      // Action & Assert
      await expect(
        replyRepositoryPostgres.verifyReplyOwner("reply-123", "user-456")
      ).rejects.toThrowError(AuthorizationError)
    })

    it("should not throw AuthorizationError when user is the owner", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      await CommentsTableTestHelper.addComment({ id: "comment-123" })
      await RepliesTableTestHelper.addReply({
        id: "reply-123",
        owner: "user-123",
      })
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {})

      // Action & Assert
      await expect(
        replyRepositoryPostgres.verifyReplyOwner("reply-123", "user-123")
      ).resolves.not.toThrowError(AuthorizationError)
    })
  })

  describe("deleteReply function", () => {
    it("should soft delete reply correctly", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      await CommentsTableTestHelper.addComment({ id: "comment-123" })
      await RepliesTableTestHelper.addReply({ id: "reply-123" })
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {})

      // Action
      await replyRepositoryPostgres.deleteReply("reply-123")

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById("reply-123")
      expect(replies[0].is_deleted).toEqual(true)
    })
  })

  describe("getRepliesByCommentId function", () => {
    it("should return replies correctly", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: "user-123",
        username: "dicoding",
      })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      await CommentsTableTestHelper.addComment({ id: "comment-123" })
      await RepliesTableTestHelper.addReply({
        id: "reply-123",
        content: "A Reply",
        commentId: "comment-123",
        owner: "user-123",
      })
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {})

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId(
        "comment-123"
      )

      // Assert
      expect(replies).toHaveLength(1)
      expect(replies[0].id).toEqual("reply-123")
      expect(replies[0].username).toEqual("dicoding")
      expect(replies[0].content).toEqual("A Reply")
      expect(typeof replies[0].date).toBe("string")
      expect(replies[0].is_deleted).toEqual(false)
      expect(typeof replies[0].is_deleted).toBe("boolean")
    })
  })
})
