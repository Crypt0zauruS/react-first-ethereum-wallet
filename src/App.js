import "./App.css";
import React, { useState, useEffect } from "react";
// import of ethers
import { ethers } from "ethers";
// !! import of the contrat
import { WALLET_CONTRACT_ADDRESS, abi } from "./Constants";

function App() {
  const [balance, setBalance] = useState(0);
  const [amountSend, setAmountSend] = useState();
  const [amountWithdraw, setAmountWithdraw] = useState();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [account, setAccount] = useState("");
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      setIsWalletInstalled(true);
      setListener(window.ethereum);
    }
    getBalance();
    // eslint-disable-next-line
  }, []);

  const handleAccount = (ethereum) => async () => {
    setError("");
    setSuccess("");
    const isLocked = !(await ethereum._metamask.isUnlocked());
    isLocked ? setAccount(null) : getBalance();
  };

  const setListener = (ethereum) => {
    ethereum.on("chainChanged", getBalance);
    ethereum.on("accountsChanged", handleAccount(ethereum));
  };

  async function getBalance() {
    setError("");
    setSuccess("");

    if (typeof window.ethereum !== "undefined") {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      // new contract instance with a provider

      if (window.ethereum.networkVersion !== "5") {
        setError("Bad network");
        setAccount(null);
        return;
      } else {
        const contract = new ethers.Contract(
          WALLET_CONTRACT_ADDRESS,
          abi,
          provider
        );

        try {
          let overrides = {
            from: accounts[0],
          };
          const data = await contract.getBalance(overrides);
          // convert result to string to avoid problems with bignumbers
          setBalance(String(data));
        } catch (err) {
          setError("There was an error !");
        }
      }
    }
  }

  async function transfer() {
    if (!amountSend) {
      // do nothing if no amount is entered
      return;
    }
    // flush states
    setError("");
    setSuccess("");
    if (typeof window.ethereum !== "undefined") {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      if (window.ethereum.networkVersion !== "5") {
        setError("Bad network");
        setAccount(null);
        return;
      } else {
        // Need a signer to send transactions
        const signer = provider.getSigner();

        try {
          // transaction properties
          const tx = {
            from: accounts[0],
            to: WALLET_CONTRACT_ADDRESS,
            value: ethers.utils.parseEther(amountSend), // convert wei to ether
          };

          const transaction = await signer.sendTransaction(tx);
          await transaction.wait();
          // flush state
          setAmountSend("");
          // update balance
          getBalance();
          setSuccess("Transaction success !");
        } catch (err) {
          setError("There was an error !");
        }
      }
    }
  }

  async function withdraw() {
    if (!amountWithdraw) {
      // do nothing if no amount is entered
      return;
    }
    // flush states
    setError("");
    setSuccess("");
    if (typeof window.ethereum !== "undefined") {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      if (window.ethereum.networkVersion !== "5") {
        setError("Bad network");
        setAccount(null);
        return;
      } else {
        // Need a signer to send transactions
        const signer = provider.getSigner();
        // new contract instance with a signer
        const contract = new ethers.Contract(
          WALLET_CONTRACT_ADDRESS,
          abi,
          signer
        );
        let transaction;
        try {
          transaction = await contract.withdrawMoney(
            accounts[0],
            ethers.utils.parseEther(amountWithdraw)
          );
          await transaction.wait();
          // flush state
          setAmountWithdraw("");
          // update balance
          getBalance();
          setSuccess("Money withdrawed successfully !");
        } catch (err) {
          setError("There was an error !");
        }
      }
    }
  }

  function changeAmountSend(e) {
    setAmountSend(e.target.value);
  }

  function changeAmountWithdraw(e) {
    setAmountWithdraw(e.target.value);
  }

  return (
    <div className="App">
      <div className="container">
        <div className="logo">
          <i className="fab fa-ethereum"></i>
        </div>
        <br />

        {isWalletInstalled ? (
          <div>
            <div>{account && <h3>Connected to {account}</h3>}</div>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            {account ? (
              <h2>
                <span className="eth">My contract :</span> {balance / 10 ** 18}{" "}
                <span className="eth">eth</span>
              </h2>
            ) : (
              <h3>Please connect your wallet to the Goerli network</h3>
            )}
            <div className="walletMain">
              <div className="walletLeft">
                <h3>Send Ether in this Wallet</h3>
                <input
                  type="number"
                  disabled={!account}
                  min={0}
                  required
                  placeholder="Amount in Ethers"
                  onChange={changeAmountSend}
                />
                <button onClick={transfer}>Receive</button>
              </div>
              <div className="walletRight">
                <h3>Withdraw Ethers from this wallet</h3>
                <input
                  type="number"
                  disabled={!account}
                  min={0}
                  required
                  placeholder="Amount in Ethers"
                  onChange={changeAmountWithdraw}
                />
                <button onClick={withdraw}>Withdraw</button>
              </div>
            </div>
          </div>
        ) : (
          <h3>Metamask in not installed</h3>
        )}
      </div>
    </div>
  );
}

export default App;
