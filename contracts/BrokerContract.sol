// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//import "hardhat/console.sol";


contract BrokerageContract {
    address public owner;
    address public admin;

    address public brokerAddress;
    address public payerAddress;

    uint256 public totalAmount;

    IERC20 public token;

    constructor(){
        owner = msg.sender;
        //--- TODO : add my address
        // admin = address(0xc0526733fB1cc4DDF3E8f034Ede88A1e76899015);
        admin = 0xc0526733fB1cc4DDF3E8f034Ede88A1e76899015;
        // setToken(address)
    }

    /* --- if later wanted to change --- */
    function adminSetTotalAmount(uint _amount) public onlyBroker notLocked {
        totalAmount = _amount;
    }

    function setAdmin(address _admin) public onlyOwner notLocked {
        admin = _admin;
    }
    /* --- if later wanted to change --- */
    function setBroker(address _broker) external onlyOwner notLocked {
        // require(brokerAddress == address(0), "broker already defined");
        brokerAddress = _broker;
    }

    /* --- when broker first runs --- */
    function setBrokerAndAmount(uint _amount) external notLocked {
        require(brokerAddress == address(0), "broker already defined");
        brokerAddress = msg.sender;
        totalAmount = _amount;
    }

    /* --- when Payer first signs --- */
    function setPayerAndFreeze() public notLocked {
        // payerAddress = _payer;
        require(token.balanceOf(payerAddress) >= totalAmount, "not enough Token");
        payerAddress = msg.sender;
        freezeToken();
    }

    function adminSetPayerAddress(address _payer) external onlyOwner notLocked {
        payerAddress = _payer;
    }

    /*--------< INIT >--------*/
    // TODO: Remove this part later
    // function init(address _tokenAddress) public {
    function init() public {
        brokerAddress = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2;
        payerAddress = 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db;
        admin = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;
        totalAmount = 1000;
        setToken(0xd9145CCE52D386f254917e481eB44e9943F39138);
        // setToken(_tokenAddress);
    }
    /*<>----------------<>*/

    address tokenAddress;
    function setToken(address _tokenAddress) public onlyOwner notLocked {
        //--- USDT contract address on BSC = 0x69bab60997a2f5cbee668e5087dd9f91437206bb
        //--- USDT contract address on BSC = 0x55d398326f99059fF775485246999027B3197955
        token = IERC20(_tokenAddress);
        tokenAddress = _tokenAddress;
    }

    // function freezeToken() public onlyPayer {
    function freezeToken() public {
        require(token.balanceOf(payerAddress) >= totalAmount, "not enough Token");
        // require() //--- check if payer has enough BNB (gas fee)
        token.transferFrom(msg.sender, address(this), totalAmount);
        emit tokenFrozen(payerAddress, totalAmount, block.timestamp);
    }

    event tokenFrozen(address indexed _payer, uint _amount, uint indexed _date);

    /* --- when Payer Approves --- */
    function payerApproves() onlyPayer external {
        require(token.balanceOf(address(this)) >= 0, "No Token in Contract");
        unfreezeToken(true);
        emit payerApproved(msg.sender, block.timestamp);
    }

    event payerApproved(address indexed approver, uint indexed time);

    /* --- when Payer Approves NOT --- */
    function payerApprovesNot() onlyPayer external {
        require(token.balanceOf(address(this)) >= 0, "No Token in Contract");
        setEndDuration();
        emit payerDontApprove(msg.sender, block.timestamp);
        // unfreezeToken(false);
    }
    event payerDontApprove(address indexed approver, uint indexed time);

    /* --- After Payer Approves Not, if want to withdraw --- */
    function payerWithdraw() external notLocked {
        unfreezeToken(false);
    }

    function unfreezeToken(bool _isApproved) internal notLocked userNotLocked {
        require(token.balanceOf(address(this)) >= totalAmount, "not enough Token in contract");
        // require(); //--- check if payer has enough BNB (gas fee)

        //--- Broker (Deal is done)
        if (_isApproved){
            // uint _adminShare = totalAmount * 0.05;
            uint _adminShare = totalAmount / 20;

            emit dd("admin share", _adminShare, msg.sender);

            token.transfer(payable(admin), _adminShare);
            emit unfrozen("admin", _adminShare, block.timestamp);

            uint _brokerShare = totalAmount - _adminShare ;

            emit dd("_broker share", _brokerShare, msg.sender);

            // token.transfer(payable(brokerAddress), token.balanceOf(address(this)));
            token.transfer(payable(brokerAddress), _brokerShare);
            emit unfrozen("broker", _brokerShare, block.timestamp);
        }
        //--- Payer (Deal is off)
        else {
            emit dd("block.timestamp", block.timestamp, msg.sender);
            emit dd("endDuration", endDuration, msg.sender);
            // console.log( "endDuration:");
            // console.log( endDuration);
            // console.log( "timestamp:");
            // console.log( block.timestamp);
            require(block.timestamp >= endDuration, "Time Locked. Have to wait");
            token.transfer(payable(payerAddress), totalAmount);
            emit unfrozen("payer", totalAmount, block.timestamp);
        }

    }

    function checkDuration() public view returns(uint) {
        // console.log(endDuration);
        return endDuration;
    }

    function timeNow() public view returns(uint) {
        // console.log(block.timestamp);
        return block.timestamp;
    }

    event dd(string str, uint num, address adr );

    event unfrozen(string indexed toWho, uint amount, uint time);

    event error(string indexed error, uint time);




    /*--------< Time Lock Part >--------*/
    uint public endDuration;
    uint public duration = 45 days;
    // uint public duration = 1 minutes;
    function setDuration(uint _duration) public onlyBroker {
        duration = _duration;
    }

    function setEndDuration() internal {
        endDuration = duration + block.timestamp;
        emit dd("end Duration", endDuration, msg.sender);
    }

    modifier notTimeLocked {
        require(block.timestamp >= endDuration, "Time Locked. Have to wait");
        emit dd("notTimeLocked", block.timestamp, msg.sender);
        _;
    }
    /*<>----------------<>*/


    /*--------< This part is for panic times which we want to lock every important functionality >--------*/
    bool public locked = false;

    function lockContract() public onlyUsers {
        locked = true;
        emit contractLocked(msg.sender, block.timestamp);
    }
    event contractLocked(address indexed _byWho, uint indexed time);

    function unlockContract() public onlyOwner {
        locked = false;
        emit contractLocked(msg.sender, block.timestamp);
    }
    event contractUnLocked(address indexed _byWho, uint indexed time);

    modifier notLocked(){
        require(!locked, "contract is locked");
        _;
    }
    /*----------------<>*/

    /*--------< This part is for times that they have disagreements and need to go to Judge >--------*/
    bool public userLocked = false;

    function userLockContract() public onlyUsers {
        userLocked = true;
        emit userContractLocked(msg.sender, block.timestamp);
    }
    event userContractLocked(address indexed _byWho, uint indexed time);

    function userUnlockContract() public onlyOwner {
        userLocked = false;
        emit userContractUnLocked(msg.sender, block.timestamp);
    }
    event userContractUnLocked(address indexed _byWho, uint indexed time);

    modifier userNotLocked(){
        require(!userLocked, "contract is userLocked");
        _;
    }
    /*----------------<>*/


    receive() external payable {}


    modifier onlyBroker(){
        require(msg.sender == brokerAddress || msg.sender == admin, "only Broker");
        _;
    }

    modifier onlyPayer(){
        require(msg.sender == payerAddress || msg.sender == admin, "only Seller");
        _;
    }

    modifier onlyAdmin(){
        require(msg.sender == admin, "only Admin");
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == admin || msg.sender == owner, "only Admins");
        _;
    }

    modifier onlyUsers(){
        require(msg.sender == brokerAddress || msg.sender == admin || msg.sender == payerAddress || msg.sender == owner, "only users");
        _;
    }


    /*--------< Extra maintenance functionalities >--------*/

    // function withrawOtherTokens(address _tokenAddress, address _receiver) external onlyAdmin {
    function withrawOtherTokens(address _tokenAddress) external onlyOwner {
        // require(_tokenAddress != tokenAddress, "This is the Frozen currency and cant get wid=thdrawn like this");
        IERC20 otherToken =  IERC20(_tokenAddress);
        require(otherToken.balanceOf(address(this)) > 0 , "this contract does not have this token");
        otherToken.transfer(admin, otherToken.balanceOf(address(this)));

    }

    // function test(address _address) public returns(address) {
    //     //   0x69bab60997a2f5cbee668e5087dd9f91437206bb

    //     IERC20 token2 = IERC20(_address);
    //     // emit log(address(token2), token2, block.timestamp);
    //     // console.log("token = "token2);
    //     // console.log("Address :", address(token2));
    //     return address(token2);
    // }
    // event log(address indexed _address, IERC20 indexed _token, string _time);

    /*----------------<>*/

    /*--------<  >--------*/

    // function

}


// pragma solidity ^0.8.13;

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.0.0/contracts/token/ERC20/IERC20.sol
interface IERC20 {
    function totalSupply() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function transfer(address recipient, uint amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}
