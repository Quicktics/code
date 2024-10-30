var swapabi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0In",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1In",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0Out",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1Out",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "Swap",
    type: "event",
  },
];

/*
User Data

    {
        "eventName":"Swap"
    }

  */

function main(params) {
  const { ethers } = require("ethers");
 
 
  const network = params.metadata.network;
  console.log(`Network:  ${network}`);
  console.log(`Params Dataset:   ${params.metadata.dataset}`);
  const block = params.data.block;
  const receipts = params.data.receipts;

  console.log(`block Number:  ${JSON.stringify(parseInt(block.number, 16))}`);

  const eventName = params.user_data.eventName || "";
  const abi = params.user_data.abi || swapabi;

  //   let eventName = "Swap";
  const eventAbi = abi.find(
    (item) => item.type === "event" && item.name === eventName
  );

  const eventSignature = ethers.id(
    `${eventName}(${eventAbi.inputs.map((input) => input.type).join(",")})`
  );

  let events = [];
 
 
  receipts.forEach((receipt) => {
    if (receipt) {
      receipt.logs.forEach((log) => {
        try {
 
          if (log.topics[0] === eventSignature) {
            console.log(`receipt  ${JSON.stringify(receipt.transactionHash)}`);

            const indexedInputs = eventAbi.inputs.filter(
              (input) => input.indexed
            );
            const nonIndexedInputs = eventAbi.inputs.filter(
              (input) => !input.indexed
            );

             const decodedIndexed = {};
            indexedInputs.forEach((input, i) => {
              try {
                decodedIndexed[input.name] =
                  ethers.AbiCoder.defaultAbiCoder().decode(
                    [input.type],
                    log.topics[i + 1]
                  )[0];
              } catch (err) {
                console.error(
                  `Error decoding indexed input ${input.name}:`,
                  err
                );
              }
            });

             const decodedData = {};
            try {
              const nonIndexedDecoded =
                ethers.AbiCoder.defaultAbiCoder().decode(
                  nonIndexedInputs.map((input) => input.type),
                  log.data
                );
              nonIndexedInputs.forEach((input, i) => {
                decodedData[input.name] = nonIndexedDecoded[i];
              });
            } catch (error) {
              console.error(`Error decoding non-indexed data:", error`);
            }
            let decodedEvent = {};

            eventAbi.inputs.forEach((input) => {
              decodedEvent[input.name] = input.indexed
                ? decodedIndexed[input.name]
                : decodedData[input.name];
            });
            decodedEvent.transactionHash = receipt.transactionHash;

            events.push(
              JSON.parse(JSON.stringify(decodedEvent, bigIntReplacer, 2))
            );
          }
        } catch (error) {
          console.log(`parsedLog: err ${error}`);
        }
      });
    }
  });

  return {
    total: events.length,
    event: events,
    // relevantLog
  };
}

function bigIntReplacer(key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}
