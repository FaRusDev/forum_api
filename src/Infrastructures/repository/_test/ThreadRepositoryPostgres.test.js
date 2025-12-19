const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper")
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper")
const NotFoundError = require("../../../Commons/exceptions/NotFoundError")
const AddThread = require("../../../Domains/threads/entities/AddThread")
const AddedThread = require("../../../Domains/threads/entities/AddedThread")
const pool = require("../../database/postgres/pool")
const ThreadRepositoryPostgres = require("../ThreadRepositoryPostgres")

describe("ThreadRepositoryPostgres", () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable()
    await UsersTableTestHelper.cleanTable()
  })

  afterAll(async () => {
    await pool.end()
  })

  describe("addThread function", () => {
    it("should persist add thread and return added thread correctly", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      const addThread = new AddThread({
        title: "A Thread",
        body: "A Thread Body",
        owner: "user-123",
      })
      const fakeIdGenerator = () => "123"
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator
      )

      // Action
      await threadRepositoryPostgres.addThread(addThread)

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadsById("thread-123")
      expect(threads).toHaveLength(1)
    })

    it("should return added thread correctly", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      const addThread = new AddThread({
        title: "A Thread",
        body: "A Thread Body",
        owner: "user-123",
      })
      const fakeIdGenerator = () => "123"
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator
      )

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(addThread)

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: "thread-123",
          title: "A Thread",
          owner: "user-123",
        })
      )
    })
  })

  describe("verifyThreadAvailability function", () => {
    it("should throw NotFoundError when thread not available", async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {})

      // Action & Assert
      await expect(
        threadRepositoryPostgres.verifyThreadAvailability("thread-123")
      ).rejects.toThrowError(NotFoundError)
    })

    it("should not throw NotFoundError when thread available", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: "user-123" })
      await ThreadsTableTestHelper.addThread({ id: "thread-123" })
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {})

      // Action & Assert
      await expect(
        threadRepositoryPostgres.verifyThreadAvailability("thread-123")
      ).resolves.not.toThrowError(NotFoundError)
    })
  })

  describe("getThreadById function", () => {
    it("should return thread correctly", async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: "user-123",
        username: "dicoding",
      })
      await ThreadsTableTestHelper.addThread({
        id: "thread-123",
        title: "A Thread",
        body: "A Thread Body",
        owner: "user-123",
      })
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {})

      // Action
      const thread = await threadRepositoryPostgres.getThreadById("thread-123")

      // Assert
      expect(thread.id).toEqual("thread-123")
      expect(thread.title).toEqual("A Thread")
      expect(thread.body).toEqual("A Thread Body")
      expect(typeof thread.date).toBe("string")
      expect(thread.username).toEqual("dicoding")
    })
  })
})
