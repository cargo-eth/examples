const CRATE_ID = '98';

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

    console.log(resaleItems);

    // Pass our contract data and resale items to a function that will create some markup
    // and add it to the page.
    displayContractContent(contracts, resaleItems);
  }
};

run();

function displayContractContent(contracts, resaleItems) {
  let template = '';
  contracts.forEach(contract => {
    const { name, symbol, tokenAddress, tokenContractId } = contract;
    const currentResaleItems = resaleItems[tokenContractId];

    let tokenMarkup = '';
    currentResaleItems.forEach(token => {
      const { metadata, price } = token;

      tokenMarkup += `
        <div class="tile">
          <img src=${metadata.image} />
          <h3 class="bold">${metadata.name}</h3>
          <h3 class="color-primary">${cargo.web3.fromWei(
            price,
            'ether'
          )} ETH</h3>
        </div>
      `;
    });

    template += `
      <div class="contract-header">
        <h2>${name} ${symbol}</h2>
        <h3>${tokenAddress}</h3>
      </div>
      ${tokenMarkup}
    `;
  });

  document.querySelector('[data-id="token-rows"]').innerHTML = template;
}

function showContent(isEnabled) {
  const el = document.querySelector(
    `[data-id="provider-${isEnabled ? 'enabled' : 'required'}"]`
  );
  el.classList.remove('hide');
}
