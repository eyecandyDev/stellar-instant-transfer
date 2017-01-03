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


  var server = "";
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
        <label>Asset Type: </label>
        <select id="siassetType" name="assetType">
          <option value="0" selected>Native (XLM)</option>
          <option value="4">Alphanumeric 4</option>
          <option value="12">Alphanumeric 12</option>
        </select>
        
      </div>
    </div>  
    <div class="stxAsset">
      <div>                                            
        <label>Asset Code: </label>
        <input type="text" id="siassetCode" name="assetCode" placeholder="Asset Code"/>
      </div>
    </div>  
    <div class="stxAsset">
      <div>                                            
        <label>Asset Issuer: </label>
        <input type="text" id="siassetIssuer" name="assetIssuer" placeholder="Asset Issuer"/>
      </div>
    </div>    
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
    <div>
      <div>                    
        <label>Choose Network: </label>                        
        <input type="radio" name="networkType"  value="test" checked="true"> Test
        <input type="radio" name="networkType" value="public"> Public
        
      </div>
    </div>  

    <input type="hidden" id="sitxRcvr" name="rcvrID"  value="${rcvrID}"/>
    <button type="submit">Send</button>
  </form>
  
  </div>
  `;

	stellarInstantTransfer.html(txForm);
  // hide assets
  $(".stxAsset").hide();


  // display asset entry on change
  $('#siassetType').on('change', function() {
    if (this.value == 0) {
      $("#siassetCode").attr("required", null); 
      $("#siassetIssuer").attr("required", null);
      $(".stxAsset").hide();      
    };

    if (this.value != 0) {
      $(".stxAsset").show(); 
      $("#siassetCode").attr("maxlength", this.value); 
      $("#siassetCode").attr("required", true); 
      $("#siassetIssuer").attr("required", true); 

    };

  })
  
  $("#stellar-instant-transfer-form" ).submit(function( event ) {
 
    
    event.preventDefault();
    stxMsg = "Processing Transaction";
    $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>');
    var txData = {}
    txData.amount = $('#sitxAmount').val();
    txData.rcvrID = $('#sitxRcvr').val();
    txData.senderSeed = $('#sitxSeed').val();
    txData.assetType = $('#siassetType').val()
    txData.networkType = $("[name='networkType']:checked").val();

    if ( txData.assetType != 0) {
      txData.assetCode = $('#siassetCode').val();
      txData.assetIssuer = $('#siassetIssuer').val();
    }

    if (txData.networkType == 'test') {
      console.log("setting server to testNetwork");
      server = new StellarSdk.Server(testNetwork);
    }

    if (txData.networkType == 'public') {
      console.log("setting server to liveNetwork");
      StellarSdk.Network.usePublicNetwork();
      server = new StellarSdk.Server(liveNetwork);

    }


    console.log(txData);
    var senderAcct = "";
    

    // check if destination is valid
    if (!StellarSdk.Keypair.isValidPublicKey(txData.rcvrID)) {
      // not valid public key fail
      stxMsg = "Invalid Receiver ID";
      $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>');
      return false;
    }
    
    // Check if amount is valid
    if (isNaN(txData.amount)) {
        stxMsg = "Invalid Amount";
        $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>');
        return false;
    }

    // check if source is valid
    try{
      senderAcct = StellarSdk.Keypair.fromSeed(txData.senderSeed);
      if (!senderAcct) {
        stxMsg = "Invalid Seed";
        $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>');
        return false;
      }
    }
    catch(error){
      stxMsg = "Invalid Seed";
      $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>');
      return false;
    }    
    
    // build payment operation
    console.log("server", server);
    server.loadAccount(txData.rcvrID)
      .catch(function(error) {
      
        stxMsg = "Transaction failed. Destination account not active.";
        $('#stellar-instant-transfer-message').html('<h4 class="text-error">'+stxMsg+'</h4>');
        
        return false;
        
      })
      .then(function(rcvr) {
        return server.loadAccount(senderAcct.accountId());

      })
      .catch(function(error) {
      
        
        stxMsg = "Transaction failed. Sender account not active.";
        $('#stellar-instant-transfer-message').html('<h4 class="text-error">'+stxMsg+'</h4>');
        
        return false;
      })
      .then(function(sender) {
        var asset = "";

        if (txData.assetType == 0) {
          asset = StellarSdk.Asset.native();
        }else{
          asset = new StellarSdk.Asset(txData.assetCode, txData.assetIssuer);
        }

        var transaction = new StellarSdk.TransactionBuilder(sender)
                          .addOperation(StellarSdk.Operation.payment({
                            destination: txData.rcvrID,
                            asset: asset,
                            amount: txData.amount
                          }))
                          .build();
        // sign transaction
        transaction.sign(senderAcct);

        return server.submitTransaction(transaction);
      })
      .then(function(result) {
        console.log('Tx Success! Results:', result);
        stxMsg = 'Transaction Successful';
        $('#stellar-instant-transfer-message').html('<h4 class="text-info">'+stxMsg+'</h4>');
        // return false;
      })
      .catch(function(error) {
        
        console.error('Tx Error\n', error);
        if (error.extras) {
          stxMsg += "\n Result Code:"+error.extras.result_codes.transaction;
        }
        
        
        $('#stellar-instant-transfer-message').html('<h4 class="text-error">'+stxMsg+'</h4>');
      });    
  

 
  });


}); 