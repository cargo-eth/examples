const CRATE_ID = '98';

const getResaleItems = async () => {
  // Get all the vendors in your crate. The creator of the crate (you) is
  // added as a default vendor.
  const { data: vendors } = await cargo.api.getCrateVendors(CRATE_ID);

  // Map through each vendor and get the token contracts they created.
  const contractResponses = await Promise.all(
    vendors.map(({ vendorId }) => cargo.api.getVendorTokenContracts(vendorId))
  );

  // Map the responses so we have an array of just the contract data.
  const contracts = [];

  // Each vendor response has an array of contracts so we spread that data into
  // our contracts array do it is one dimensional.
  contractResponses.forEach(({ data }) => {
    contracts.push(...data);
  });

  // Get the resale items for our contracts. This method
  // takes a list of token contract IDs, not addresses.
  // The IDs are assigned by Cargo and used internally
  const { data: resaleItems } = await cargo.api.getContractResaleItems(
    contracts.map(contract => contract.tokenContractId)
  );

  // Pass our contract data and resale items to a function that will create some markup
  // and add it to the page.
  displayContractContent(contracts, resaleItems);
};

const getTokenInfo = async contractId => {
  const ownedTokens = await cargo.api.getOwnedTokenIdsByCargoTokenContractId(
    contractId
  );
  const { data: contractInfo } = await cargo.api.getTokenContractById(
    contractId
  );
  return await Promise.all(
    ownedTokens.map(
      id =>
        new Promise(async resolve => {
          const { data } = await cargo.api.getTokenMetadata(
            contractInfo.tokenAddress,
            id
          );
          resolve({
            ...data,
            tokenId: id,
            tokenContractAddress: contractInfo.tokenAddress,
          });
        })
    )
  );
};

const getOwnedTokens = async () => {
  const contractIdsWithStake = await cargo.api.getOwnedCargoTokenContractIds();

  // For every contract that we own a token in we get the information for each owned
  // token in that contract
  const ownedTokensResponse = await Promise.all(
    contractIdsWithStake.map(id => getTokenInfo(id))
  );

  // Flatten the array so it is one dimensional since the response
  // above will give us an array of arrays
  const ownedTokens = [];
  for (let i = 0; i < ownedTokensResponse.length; i++) {
    ownedTokens.push(...ownedTokensResponse[i]);
  }

  let markup = '';

  ownedTokens.forEach(token => {
    markup += getTokenTile(token);
  });

  document.querySelector('[data-id="owned-tokens"]').innerHTML = markup;
  document
    .querySelector('[data-id="owned-tokens-wrap"]')
    .classList.remove('hide');
};

const run = async () => {
  // Initialize cargo using the development network. This will fetch Cargo contract information
  // so we can begin interacting with those contracts when we are ready.
  await cargo.init({
    network: 'development',
  });

  // In order to interact with cargo contracts we will need to call the enable method.
  // This determines if the user has a provider available that will allow us to connect
  // to the Ethereum blockcain.
  const isEnabled = await cargo.enable();

  // cargo.enable returns true or false, depending on whether or not we can interact with
  // the Cargo smart contracts. We are passing that boolean value to the showContent function
  // which will show content for each case. If isEnabled equals false then we can show UI
  // that tells the user to install MetaMask, or another MetaMask type product.
  showContent(isEnabled);

  if (isEnabled) {
    // Using Promise.all to get resale items and owned tokens asynchronously
    await Promise.all([getResaleItems(), getOwnedTokens()]);
  }
};

const tokenRows = document.querySelector('[data-id="token-rows"]');
const txConfirmation = document.querySelector('[data-id="tx-confirmation"]');

tokenRows.addEventListener('click', async evt => {
  if (evt.target.dataset.id === 'buy-now') {
    const { resaleid, price } = evt.target.dataset;

    console.log(resaleid, price);
    try {
      const tx = await cargo.api.purchaseResaleToken(resaleid, price);
      txConfirmation.innerHTML = `
        ${txConfirmation.innerHTML}
        <p>Your transaction has been submitted you can check the status <a href="https://rinkeby.etherscan.io/tx/${tx}" target="_blank" rel="noopener noreferrer">here</a></p>
      `;
    } catch (e) {
      alert('Something went wrong, or user denied transaction');
    }
  }
});

function getTokenTile(metadata, price, token) {
  return `
    <div class="tile">
      <img src=${metadata.image} />
      <h3 class="bold">${metadata.name}</h3>
      ${
        price
          ? `<h3 class="color-primary">${cargo.web3.fromWei(
              price,
              'ether'
            )} ETH</h3>`
          : ''
      }
        ${
          token
            ? `
        <button class="margin-top" data-id="buy-now" data-resaleid="${
          token.resaleItemId
        }" data-price="${token.price}">Buy Now</button>
        `
            : ''
        }
    </div>
  `;
}

function displayContractContent(contracts, resaleItems) {
  let template = '';
  contracts.forEach(contract => {
    const { name, symbol, tokenAddress, tokenContractId } = contract;
    const currentResaleItems = resaleItems[tokenContractId];

    let tokenMarkup =
      currentResaleItems.length === 0 ? 'There is nothing for sale.' : '';

    // Loop through each of the tokens for sale and create some markup
    // for them.
    currentResaleItems.forEach(token => {
      const { metadata, price } = token;

      tokenMarkup += getTokenTile(metadata, price, token);
    });

    template += `
      <div class="contract-header">
        <h2>${name} ${symbol}</h2>
        <h3>${tokenAddress}</h3>
      </div>
      ${tokenMarkup}
    `;
  });

  tokenRows.innerHTML = template;
}

function showContent(isEnabled) {
  const el = document.querySelector(
    `[data-id="provider-${isEnabled ? 'enabled' : 'required'}"]`
  );
  el.classList.remove('hide');
}

run();
