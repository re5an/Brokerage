import logo from './logo.svg';
import './App.css';
import Web3 from "web3";
import BrokerABI from "./contracts/BrokerContractABI.json";
import tokenABI from "./contracts/erc20ABI.json";
import { useState, useEffect } from 'react';

const ss = console.log;

let brokerContract;
let tokenContract;

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [isLockedAdmin, setIsLockedAdmin] = useState(false)
  const [isLockedUser, setIsLockedUser] = useState(false)

  const [account, setAccount] = useState("")
  const [brokerAddress, setBrokerAddress] = useState("")
  const [payerAddress, setPayerAddress] = useState("")
  const [admin, setAdmin] = useState("")

  const [totalAmount, setTotalAmount] = useState(0)
  const [hasFrozenAmount, setHasFrozenAmount] = useState(false)

  const [tokenAddress, setTokenAddress] = useState("0x573E48319C117712A4c60A94bfdAA9244b8a2384") //--- Admin can set this
  const [contractAddress, setContractAddress] = useState("0xd3cCC38222005BBC6510B835c4542eA42424528b") //--- Admin can set this

  const loadWeb3 = async () => {
    if (typeof window.ethereum !== "undefined") {
      // Connect to metamask
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
      }
      catch (error) {
        console.log(error);
      }

      const accounts = await web3.eth.getAccounts();
      // console.log(accounts)

      if (typeof accounts[0] !== "undefined") {
        const balance = await web3.eth.getBalance(accounts[0]);
        setAccount(accounts[0]);
        // setBalance(balance);
        ss('Balance : ', balance)
      }
      else {
        ss("Please login with metamask")
      }

      try {
        brokerContract = new web3.eth.Contract(BrokerABI, contractAddress);
        // brokerContract = new web3.eth.Contract(BrokerABI, '0xa46D20eC5063AC7F9876BEd67c4C5287F4d5A999');
        setIsLoggedIn(true);

        // tokenContract = new web3.eth.Contract(tokenABI, '0x573E48319C117712A4c60A94bfdAA9244b8a2384');
        tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

        await getInitialData();
      }
      catch (e) {
        console.log("Error loading smart contract: " + e);
      }
    }
    else {
      window.alert("Please install metamask")
    }
  };

  const getInitialData = async () => {
    const brokerAddress = await brokerContract.methods.brokerAddress().call();
    setBrokerAddress(brokerAddress);

    const totalAmount = await brokerContract.methods.totalAmount().call();
    if (totalAmount > 0) setTotalAmount(totalAmount);

    const adminAddress = await brokerContract.methods.admin().call();
    setAdmin(adminAddress);

    const isLockedAdmin = await brokerContract.methods.locked().call();
    setIsLockedAdmin(isLockedAdmin);

    const isLockedUser = await brokerContract.methods.userLocked().call();
    setIsLockedUser(isLockedUser);

    const payerAddress = await brokerContract.methods.payerAddress().call();
    setPayerAddress(payerAddress);

    const contractBalance = await contractBalanceToken();
    if (contractBalance > 0 && contractBalance == totalAmount) setHasFrozenAmount(true)

    ss('brokerAddress : ', brokerAddress)
    // ss('totalAmount : ', totalAmount)
    // ss('adminAddress : ', adminAddress)

  }

  const handleLogin = async () => {
    await loadWeb3();
  }

  // useEffect(
  //     async () => {
  //       const data = await getInitialData();
  //     }, []
  // )

  const setBroker = async () => {
    try{
      const receipt = await brokerContract.methods.setBroker(account).send({from: account});
      ss(receipt)
    } catch (e) {
      ss("error setting Broker with error: ");
      ss(e)
    }
  }

  const isBroker = () => {

    // const result = isLoggedIn ?
    //     account === brokerAddress :
    //     false
    //
    // ss("result isBroker : "+ result)

    return isLoggedIn ?
        account === brokerAddress :
        false
  }



  const setPayer = async () => {
    try{
      const receipt = await brokerContract.methods.setPayer(account).send({from: account});
      ss(receipt)
    } catch (e) {
      ss("error setting Payer with error: ");
      ss(e)
    }
  }

  const isPayer = () => {
    return isLoggedIn ?
        account === payerAddress :
        false
  }



  const setAmount = async () => {
    try{
      const receipt = await brokerContract.methods.adminSetTotalAmount(totalAmount).send({from: account});
      ss(receipt)
      setTotalAmount(totalAmount)
    } catch (e) {
      ss("error setting Amount with error: ");
      ss(e)
    }
  }


  // ----------------- Lock Functions ----------------- //

  const lockContractUser = async () => {  //--- Both Payer and Broker can lock when they disagree
    try{
      const receipt = await brokerContract.methods.userLockContract().send({from: account});
      ss(receipt)
      setIsLockedUser(true)
    } catch (e) {
      ss("error setting Amount with error: ");
      ss(e)
    }
  }

  const unlockContractUser = async () => {   //--- Only Admin can unlock
    try{
      const receipt = await brokerContract.methods.userUnlockContract().send({from: account});
      ss(receipt)
      setIsLockedUser(false)
    } catch (e) {
      ss("error setting Amount with error: ");
      ss(e)
    }
  }

  const lockContractAdmin = async () => {  //--- Panic Lock. Only Admin
    try{
      const receipt = await brokerContract.methods.lockContract().send({from: account});
      ss(receipt)
      setIsLockedAdmin(true)
    } catch (e) {
      ss("error setting Lock with error: ");
      ss(e)
    }
  }

  const unlockContractAdmin = async () => {  //--- Panic Lock. Only Admin
    try{
      const receipt = await brokerContract.methods.unlockContract().send({from: account});
      ss(receipt)
      setIsLockedAdmin(false)
    } catch (e) {
      ss("error setting unLock with error: ");
      ss(e)
    }
  }

  // ----------------- Tokens Functions ----------------- //

  const freezeTokens = async () => {
    try{
      const allowanceReceipt = await tokenContract.methods.approve(contractAddress, totalAmount).send({from: account});
      const receipt = await brokerContract.methods.freezeToken().send({from: account});
      ss(receipt)
      setHasFrozenAmount(true)
    } catch (e) {
      ss("error setting Token Address with error: ");
      ss(e)
    }
  }

  const payerApproves = async () => {
    try{
      const payerApprovesReceipt = await brokerContract.methods.payerApproves().send({from: account});
      ss(payerApprovesReceipt)
      // setHasFrozenAmount(true)
    } catch (e) {
      ss("error Payer Approve with error: ");
      ss(e)
    }
  }

  const payerApprovesNot = async () => {
    try{
      const payerApprovesReceipt = await brokerContract.methods.payerApprovesNot().send({from: account});
      ss(payerApprovesReceipt)
      // setHasFrozenAmount(true)
    } catch (e) {
      ss("error Payer approves not with error: ");
      ss(e)
    }
  }

  const contractBalanceToken = async () => {  //--- Amount of frozen USDT in contract
    try{
      const balance = await tokenContract.methods.balanceOf(contractAddress).send({from: account});
      ss(receipt)
      // setIsLockedAdmin(false)
      return balance;
    } catch (e) {
      ss("error setting unLock with error: ");
      ss(e)
      return -1;
    }
  }

  const addressBalanceToken = async (address = account) => {  //--- Amount of frozen USDT in contract
    try{
      const balance = await tokenContract.methods.balanceOf(address).send({from: account});
      ss(receipt)
      // setIsLockedAdmin(false)
      return balance;
    } catch (e) {
      ss("error setting unLock with error: ");
      ss(e)
      return -1;
    }
  }

  const setToken = async (tokenAddress) => {  //--- Set the Token in contract. Only admin
    try{
      const receipt = await brokerContract.methods.setToken(tokenAddress).send({from: account});
      ss(receipt)
      setTokenAddress(false)
    } catch (e) {
      ss("error setting Token Address with error: ");
      ss(e)
    }
  }




  /**
   *
   * Welcome page + login
   *
   *
   * if sender = null => { Login as Broker, enter amount}
   * else { Login as user.  }
   *
   * if Broker != null & User = null => { when Broker login, he can set or change amount }
   *
   * if User has Frozen amount => when he login he can see the  contract data. other not registered addresses can not
   * if User has Frozen amount => when Broker login, he can lock the contract (BrokerLock) it means they have problem and Broker thinks he is cheated
   * if User has Frozen amount => when Broker login, he can not change amount (BrokerLock) it means they have problem and Broker thinks he is cheated
   *
   *
   * --- Pages:
   * Welcome + login
   *
   * Broker:{confirm he is Broker + setAmount + (after freeze) lock and see contract status}
   *
   * User: {contract & confirm & freeze amount + see contract status}
   *
   */

  return (
      <div className="App">
        <header className="App-header">
          {/*{isLoggedIn && brokerAddress == account &&*/}
          {isBroker() && <h2>Welcome Broker</h2> }
          {isPayer() && <h2>Welcome Customer</h2> }

          {totalAmount > 0 && <p>Amount: ${totalAmount}</p>}

          {totalAmount == 0 && <p> Amount Not set yet</p>}
          {/*<p>admin = {admin}</p>*/}
          {/*<p>account = {account}</p>*/}
          {/*<p>broker = {brokerAddress}</p>*/}

          {brokerAddress == '0x0000000000000000000000000000000000000000' && isLoggedIn &&
            <button onClick={setBroker}>Login as Broker</button>
          }

          {/* Set Amount */}
          {totalAmount == 0 && isBroker() && !hasFrozenAmount &&
            <>
              <label htmlFor="amount">Enter Amount:</label>
              <input
                  type="text"
                  name="amount"
                  onChange={event => setTotalAmount(event.target.value)}
              />
              <button onClick={setAmount}>Set Contract Amount</button>
            </>

          }

          {/* Change Amount */}
          {totalAmount != 0 && isBroker() && !hasFrozenAmount &&
          payerAddress == '0x0000000000000000000000000000000000000000' &&
            <>
              <label htmlFor="amount">Change Amount:</label>
              <input
                  type="text"
                  name="amount"
                  onChange={event => setTotalAmount(event.target.value)}
              />
              <button onClick={setAmount}>Set Amount</button>
            </>
          }

          {/* Sign in as Payer */}
          {totalAmount != 0 && isLoggedIn && account != brokerAddress &&
          payerAddress == '0x0000000000000000000000000000000000000000' &&
            <>
              <p>You can Register yourself as Payer</p>
              <button onClick={setPayer}>Sign as Payer</button>
            </>
          }

          {/* Payer Freeze Amount */}
          {totalAmount != 0 && isLoggedIn && account === payerAddress && !hasFrozenAmount &&
            <>
              <p>
                According to this contract, you agree to freeze {totalAmount} USDT (Tether)
                into the smart contract so that if the deal was successful, this amount will be
                payed automatically to the broker. Otherwise after 45 days you can claim
                this amount back
              </p>
              <button onClick={freezeTokens}>Freeze {totalAmount} $ </button>
            </>
          }

          {/* Payer Approves */}
          {totalAmount != 0 && isLoggedIn && account === payerAddress && hasFrozenAmount &&
          <>
            <p>
              If the deal is done successfully, you can unfreeze the frozen amount to its receiver
            </p>
            <button onClick={payerApproves}>Unfreeze USDT to Broker </button>
          </>
          }


          {!isLoggedIn && <button onClick={handleLogin}> Please Login to continue</button>}
          {/*{isLoggedIn && <button onClick={handleLogin}> Logout </button>}*/}

        </header>
      </div>
  );
}

export default App;