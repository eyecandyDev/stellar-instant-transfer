/*******************************************************
* Name: stellar-instant-transfer.js                    * 
* Author: @eyecandyDev on github                       *
* Description: This plugin allows other                *
* users to transfer lumens to you instantly.           *
* Usage: To be integrated into web pages               *
*                                                      * 
********************************************************
*/



jQuery(document).ready( function($){
  var testNetwork = "https://horizon-testnet.stellar.org";
  var liveNetwork = "https://horizon.stellar.org";

  // Uncomment the line below if using the live(public) Network
  // StellarSdk.Network.usePublicNetwork();

  var server = new StellarSdk.Server(testNetwork);
  var stxMsg = "Processing Transaction";
	var stellarInstantTransfer = $('#stellar-instant-transfer');
	var rcvrID = stellarInstantTransfer.data("rcvr");
  // console.log(rcvrID);
  // console.log(server);


	var txForm=`
  <div style="padding: 10px;">
  <h3>Send Funds instantly</h3>
  <div id="stellar-instant-transfer-message"></div>
  <form id="stellar-instant-transfer-form" name="stxForm" method="POST">
    <div>
      <div>                                            
        <label>Amount: </label>
        <input type="number" id="sitxAmount" name="amount" placeholder="Amount" required/>
        
      </div>
    </div>
    <div>
      <div>                    
        <label>Account Seed: </label>                        
        <input type="text" class="form-control" id="sitxSeed" name="senderSeed"  placeholder="Stellar Account Seed" required/>
        
      </div>
    </div>  
    <input type="hidden" id="sitxRcvr" name="rcvrID"  value="${rcvrID}"/>
    <button type="submit">Send</button>
  </form>
  
  </div>
  `;

	stellarInstantTransfer.html(txForm);
  

  
  $("#stellar-instant-transfer-form" ).submit(function( event ) {
 
    
    event.preventDefault();
    stxMsg = "Processing Transaction";
    $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>')
    var txData = {}
    txData.amount = $('#sitxAmount').val();
    txData.rcvrID = $('#sitxRcvr').val();
    txData.senderSeed = $('#sitxSeed').val();
    console.log(txData);
    var senderAcct = "";
    var txMsg = [];

    // check if destination is valid
    if (!StellarSdk.Keypair.isValidPublicKey(txData.rcvrID)) {
      // not valid public key fail
      stxMsg = "Invalid Receiver ID";
      $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>')
      return false;
    }
    
    // Check if amount is valid
    if (isNaN(txData.amount)) {
        stxMsg = "Invalid Amount";
        $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>')
        return false;
    }

    // check if source is valid
    try{
      senderAcct = StellarSdk.Keypair.fromSeed(txData.senderSeed);
      if (!senderAcct) {
        stxMsg = "Invalid Seed";
        $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>')
        return false;
      }
    }
    catch(error){
      stxMsg = "Invalid Seed";
      $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>')
      return false;
    }    
    
    // build payment operation
    server.loadAccount(txData.rcvrID)
      .catch(StellarSdk.NotFoundError, function(error) {
      
        txMsg.push('Destination Account not active');
        // Throw error
        throw new Error("Destination not active");
      })
      .then(function() {
        return server.loadAccount(senderAcct.accountId());

      })
      .catch(StellarSdk.NotFoundError, function(error) {
      
        txMsg.push('Sender Account not active');
        throw new Error("Sender not active");
        
      })
      .then(function(sender) {
        var transaction = new StellarSdk.TransactionBuilder(sender)
                          .addOperation(StellarSdk.Operation.payment({
                            destination: txData.rcvrID,
                            asset: StellarSdk.Asset.native(),
                            amount: txData.amount
                          }))
                          .build();
        // sign transaction
        transaction.sign(senderAcct);

        return server.submitTransaction(transaction);
      })
      .then(function(result) {
        console.log('Tx Success! Results:', result);
        txMsg.push('Transaction Successful');
        $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+txMsg+'</h4>')
        // return false;
      })
      .catch(function(error) {
        console.error('Tx Error\n', error);
        txMsg.push('Transaction Failed');
        $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+txMsg+'</h4>')
      });    
  

 
  });


}); 