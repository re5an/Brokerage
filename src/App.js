import logo from './logo.svg';
import './App.css';
import Web3 from "web3";
import BrokerABI from "./contracts/BrokerContractABI.json";
import { useState, useEffect } from 'react';

const ss = console.log;

let brokerContract;

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLockedAdmin, setIsLockedAdmin] = useState(false)
  const [isLockedUser, setIsLockedUser] = useState(false)
  const [account, setAccount] = useState("")
  const [brokerAddress, setBrokerAddress] = useState("")
  const [totalAmount, setTotalAmount] = useState(0)
  const [contractAmount, setContractAmount] = useState(0)
  const [admin, setAdmin] = useState("")
  const [payerAddress, setPayerAddress] = useState("")

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
        // Access smart contracts
        // console.log(BrokerABI);
        brokerContract = new web3.eth.Contract(BrokerABI, '0xd3cCC38222005BBC6510B835c4542eA42424528b');
        // brokerContract = new web3.eth.Contract(BrokerABI, '0xa46D20eC5063AC7F9876BEd67c4C5287F4d5A999');
        setIsLoggedIn(true);

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

  const setPayer = async () => {
    try{
      const receipt = await brokerContract.methods.setPayer(account).send({from: account});
      ss(receipt)
    } catch (e) {
      ss("error setting Payer with error: ");
      ss(e)
    }
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

  const isPayer = () => {
    return isLoggedIn ?
        account === payerAddress :
        false
  }

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

          {totalAmount == 0 && isBroker() &&
            <>
              <label htmlFor="amount">Enter Amount:</label>
              <input
                  type="text"
                  name="amount"
                  onChange={event => setTotalAmount(event.target.value)}
              />
              <button onClick={setAmount}>Set Amount</button>
            </>

          }

          {totalAmount != 0 && isBroker() &&
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

          {totalAmount != 0 && isLoggedIn && account != brokerAddress && payerAddress == '0x0000000000000000000000000000000000000000' &&
            <>
              <p>You can Register yourself as Payer</p>
              <button onClick={setAmount}>Set Amount</button>
            </>
          }


          {!isLoggedIn && <button onClick={handleLogin}> Please Login to continue</button>}
          {/*{isLoggedIn && <button onClick={handleLogin}> Logout </button>}*/}
        </header>
      </div>
  );
}

export default App;