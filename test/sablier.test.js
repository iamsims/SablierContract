const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Contract Sablier", function () {
  let owner, sender1, sender2, reciever1, reciever2;

  before("Deployment and intial setup ", async function () {
    [owner, sender1, sender2, reciever1, reciever2] = await ethers.getSigners();
    const Sablier = await ethers.getContractFactory("Sablier");
    this.sablier = await Sablier.deploy();
    const USDSimple = await ethers.getContractFactory("USDSimple");
    this.usdc = await USDSimple.deploy("USDSimple", "USDC", 1000000);
    this.usdu = await USDSimple.deploy("New Token", "USDU", 1000000);

    //transfer funds to senders from both the tokens
    await this.usdc.transfer(sender1.address, 1000);
    await this.usdu.transfer(sender1.address, 1000);

    await this.usdc.transfer(sender2.address, 1000);
    await this.usdu.transfer(sender2.address, 1000);

    //approve the Sablier contract to use the senders balances
    await this.usdc.connect(sender1).approve(this.sablier.address, 1000);
    await this.usdu.connect(sender1).approve(this.sablier.address, 1000);

    await this.usdc.connect(sender2).approve(this.sablier.address, 1000);
    await this.usdu.connect(sender2).approve(this.sablier.address, 1000);
  });

  it("Spending by the contract on behalf of senders are approved", async function () {
    expect(
      await this.usdu.allowance(sender1.address, this.sablier.address)
    ).to.equal(1000);
    expect(
      await this.usdc.allowance(sender1.address, this.sablier.address)
    ).to.equal(1000);

    expect(
      await this.usdu.allowance(sender2.address, this.sablier.address)
    ).to.equal(1000);

    expect(
      await this.usdc.allowance(sender2.address, this.sablier.address)
    ).to.equal(1000);
  });

  it("Gets all the incoming streams for all users", async function () {
    startTime = Math.floor(Date.now() / 1000) + 20; //expected to start after 100 seconds
    endTime = startTime + 10; //delta = 5 seconds

    let result = await this.sablier.getIncomingStream(reciever1.address);
    expect(result.length).to.be.equal(0); //no streams

    await this.sablier.connect(sender1).createStream(
      reciever1.address,
      100, //rps = 20
      this.usdc.address,
      startTime,
      endTime
    );

    await this.sablier
      .connect(sender1)
      .createStream(
        reciever2.address,
        100,
        this.usdc.address,
        startTime,
        endTime
      );

    await this.sablier
      .connect(sender1)
      .createStream(
        reciever2.address,
        100,
        this.usdu.address,
        startTime,
        endTime
      );

    result = await this.sablier.getIncomingStream(reciever1.address);
    expect(result.length).to.be.equal(1);

    result = await this.sablier.getIncomingStream(reciever2.address);
    expect(result.length).to.be.equal(2);

    this.endTime1 = endTime; //later used to test tokenBalance
  });

  it("should return all the outgoing streams for a particular address", async function () {
    let result = await this.sablier.getOutgoingStream(sender2.address);
    expect(result.length).to.be.equal(0); //no streams

    result = await this.sablier.getOutgoingStream(sender1.address);
    expect(result.length).to.be.equal(3);
  });

  it("Correctness of incoming streams and outgoing streams after cancelling streams", async function () {
    let result1 = await this.sablier.getOutgoingStream(sender1.address);
    let result2 = await this.sablier.getIncomingStream(reciever1.address);
    await this.sablier.connect(sender1).cancelStream(100000);
    let result3 = await this.sablier.getOutgoingStream(sender1.address);
    let result4 = await this.sablier.getIncomingStream(reciever1.address);

    expect(result3.length).to.be.equal(result1.length - 1);
    expect(result4.length).to.be.equal(result2.length - 1);
  });

  it("Testing pagination for getIncomingStreams", async function () {
    const startTime = Math.floor(Date.now() / 1000) + 1000; //expected to start after 1000 seconds
    const endTime = startTime + 100; //delta = 1 seconds

    await this.sablier
      .connect(sender1)
      .createStream(
        reciever2.address,
        100,
        this.usdu.address,
        startTime,
        endTime
      );

    await this.sablier
      .connect(sender1)
      .createStream(
        reciever1.address,
        100,
        this.usdu.address,
        startTime,
        endTime
      );

    await this.sablier
      .connect(sender1)
      .createStream(
        reciever2.address,
        100,
        this.usdu.address,
        startTime,
        endTime
      );

    //upto here:
    //sender1 has sent 5 streams
    //reciever1 has got 1 streams
    //reciever2 has got 4 streams

    //when regular values of limit and offset
    let [newoffset, result] = await this.sablier.getIncomingStreams(
      reciever2.address,
      1,
      2
    );

    expect(result.length).to.be.equal(1);
    expect(newoffset).to.be.equal(3);

    //Edge cases with various kinds of limit and offset

    //when limit+offset is greater than the length of incomingStreams
    [newoffset, result] = await this.sablier.getIncomingStreams(
      reciever1.address,
      1,
      1
    );

    expect(result.length).to.be.equal(0);
    expect(newoffset).to.be.equal(1);

    //when limit is greater than the length of incomingStreams
    [newoffset, result] = await this.sablier.getIncomingStreams(
      reciever1.address,
      3,
      0
    );

    expect(result.length).to.be.equal(1);
    expect(newoffset).to.be.equal(1);

    //when offset is equal or greater than the length of incomingStreams
    [newoffset, result] = await this.sablier.getIncomingStreams(
      reciever1.address,
      1,
      1
    );

    expect(result.length).to.be.equal(0);
    expect(newoffset).to.be.equal(1);

    this.endTime2 = endTime; //later used to test tokenBalance
  });

  it("Testing pagination for getOutgoingStreams", async function () {
    //when regular values of limit and offset
    let [newoffset, result] = await this.sablier.getOutgoingStreams(
      sender1.address,
      1,
      2
    );

    expect(result.length).to.be.equal(1);
    expect(newoffset).to.be.equal(3);

    //Edge cases with various kinds of limit and offset

    //when limit+offset is greater than the length of incomingStreams
    [newoffset, result] = await this.sablier.getOutgoingStreams(
      reciever1.address,
      1,
      1
    );

    expect(result.length).to.be.equal(0);
    expect(newoffset).to.be.equal(1);

    //when limit is greater than the length of incomingStreams
    [newoffset, result] = await this.sablier.getOutgoingStreams(
      sender1.address,
      6,
      0
    );

    expect(result.length).to.be.equal(5);
    expect(newoffset).to.be.equal(5);

    //when offset is equal or greater than the length of incomingStreams
    [newoffset, result] = await this.sablier.getOutgoingStreams(
      sender1.address,
      1,
      5
    );

    expect(result.length).to.be.equal(0);
    expect(newoffset).to.be.equal(5);
  });

  it("Testing token balance for different users", async function () {
    let result = await this.sablier.getTokenBalance(reciever2.address);

    expect(result.length).to.be.equal(2); //provides total number of tokens
    expect(result[0].tokenAddress).to.be.equal(this.usdc.address); //in the order any stream with the tokens are created
    expect(result[1].tokenAddress).to.be.equal(this.usdu.address);
    expect(result[0].incomingBalance).to.be.equal(0); //first token has
    expect(result[1].incomingBalance).to.be.equal(0);

    //set blocktimestamp such that the stream 100001 and 100002 get completely transferred to recievers
    await network.provider.send("evm_setNextBlockTimestamp", [this.endTime1]);
    await network.provider.send("evm_mine");

    result = await this.sablier.getTokenBalance(reciever2.address);
    expect(result[0].incomingBalance).to.be.equal(100);
    expect(result[1].incomingBalance).to.be.equal(100);

    //set blocktimestamp such that all the streams get completely transferred to recievers
    await network.provider.send("evm_setNextBlockTimestamp", [this.endTime2]);
    await network.provider.send("evm_mine");

    result = await this.sablier.getTokenBalance(reciever2.address);
    expect(result[0].incomingBalance).to.be.equal(100);
    expect(result[1].incomingBalance).to.be.equal(300);
  });
});
