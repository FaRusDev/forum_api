const AddThreadUseCase = require("../AddThreadUseCase")
const AddThread = require("../../../Domains/threads/entities/AddThread")
const AddedThread = require("../../../Domains/threads/entities/AddedThread")
const ThreadRepository = require("../../../Domains/threads/ThreadRepository")

describe("AddThreadUseCase", () => {
  it("should orchestrating the add thread action correctly", async () => {
    // Arrange
    const useCasePayload = {
      title: "A Thread",
      body: "A Thread Body",
      owner: "user-123",
    }

    const mockAddedThread = new AddedThread({
      id: "thread-123",
      title: useCasePayload.title,
      owner: useCasePayload.owner,
    })

    const mockThreadRepository = new ThreadRepository()

    mockThreadRepository.addThread = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockAddedThread))

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    })

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload)

    // Assert
    expect(addedThread).toStrictEqual(
      new AddedThread({
        id: "thread-123",
        title: useCasePayload.title,
        owner: useCasePayload.owner,
      })
    )

    expect(mockThreadRepository.addThread).toBeCalledWith(
      new AddThread({
        title: useCasePayload.title,
        body: useCasePayload.body,
        owner: useCasePayload.owner,
      })
    )
  })
})
