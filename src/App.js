import logo from './logo.svg';
import './App.css';
import Web3 from "web3";
import BrokerABI from "./contracts/BrokerContractABI.json";
import { useState } from 'react';

const ss = console.log;

let brokerContract;

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
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
        brokerContract = new web3.eth.Contract(BrokerABI, '0x081F9696f405Ca5A3093066802eAF444f07f2D96');
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

    const contractAmount = await brokerContract.methods.totalAmount().call();
    if (totalAmount > 0) setContractAmount(contractAmount);

    const adminAddress = await brokerContract.methods.admin().call();
    setAdmin(adminAddress);

    const payerAddress = await brokerContract.methods.payerAddress().call();
    setPayerAddress(payerAddress);

    ss('brokerAddress : ', brokerAddress)
    // ss('totalAmount : ', totalAmount)
    // ss('adminAddress : ', adminAddress)

  }

  const handleLogin = async () => {
    await loadWeb3();
  }

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
      setContractAmount(totalAmount)
    } catch (e) {
      ss("error setting Amount with error: ");
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
          {isBroker() &&
          <h2>Welcome Broker</h2>
          }
          {isPayer() &&
          <h2>Welcome Customer</h2>
          }

          {contractAmount > 0 && <p>Amount: ${contractAmount}</p>}

          {contractAmount == 0 && <p> Amount Not set yet</p>}
          {/*<p>admin = {admin}</p>*/}
          {/*<p>account = {account}</p>*/}
          {/*<p>broker = {brokerAddress}</p>*/}

          {brokerAddress == '0x0000000000000000000000000000000000000000' && isLoggedIn &&
            <button onClick={setBroker}>Login as Broker</button>
          }

          {contractAmount == 0 && isBroker() &&
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

          {contractAmount != 0 && isBroker() &&
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

          {contractAmount != 0 && isLoggedIn && account != brokerAddress && payerAddress == '0x0000000000000000000000000000000000000000' &&
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