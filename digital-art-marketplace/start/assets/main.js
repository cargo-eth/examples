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
};

run();

/**
 * UTILITY FUNCTIONS. NO NEED TO MODIFY.
 */

function showContent(isEnabled) {
  const el = document.querySelector(
    `[data-id="provider-${isEnabled ? 'enabled' : 'required'}"]`
  );
  el.classList.remove('hide');
}
