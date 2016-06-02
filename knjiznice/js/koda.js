
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
  var ehrId = "";
  var oseba;
  var meritve;
        if(stPacienta == 1){
            oseba = ["Winchester,Dean,1984-07-25T11:32"];
            meritve =["2014-11-21T11:40Z",185,80.0,36.50,118,92,98,"medicinska sestra Smrketa"];
        }else if(stPacienta == 2){
            oseba = ["Rich,Piana,1971-09-26T14:58"];
             meritve =["2014-11-21T11:40Z",185,80.0,36.50,118,92,98,"medicinska sestra Smrketa"];
        }else if(stPacienta == 3){
            oseba = ["Winchester,Sam,1987-05-03T09:58"];
            meritve =["2014-11-21T11:40Z",185,80.0,36.50,118,92,98,"medicinska sestra Smrketa"];
        }
        
    var sessionId = getSessionId();

	var ime = oseba[0];
	var priimek = oseba[1];
	var datumRojstva =oseba[2];

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                   var izpisiImePriimek = oseba[0]+" "+oseba[1];
		                   var izpisiVse = oseba[1]+","+oseba[0]+","+oseba[2]+","+ehrId;
		                    $('#preberiPredlogoBolnika').append('<option value="'+izpisiVse+'">'+izpisiImePriimek+'</option>');
		                    for(var i in meritve){
		                    	vitalniZnakiGeneriranegaPacienta(meritve,ehrId,i);
		                    }
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}

  return ehrId;

}
function vitalniZnakiGeneriranegaPacienta(meritve,ehrId,indeks){
    var sessionId = getSessionId();
    var ehrId = ehrId;
    var datum = meritve[0];
    var visina = meritve[1];
    var teza = meritve[2];
    var telesnaTemp = meritve[3];
    var sistolicniTlak = meritve[4];
    var diastolicniTlak = meritve[5];
    var nasicenostKisika = meritve[6];
    var merilec = meritve[7];
    
    	if (!ehrId || ehrId.trim().length == 0) {
			$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
	      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
		} else {
			$.ajaxSetup({
			    headers: {"Ehr-Session": sessionId}
			});
			var podatki = {
			    "ctx/language": "en",
			    "ctx/territory": "SI",
			    "ctx/time": datum,
			    "vital_signs/height_length/any_event/body_height_length": visina,
			    "vital_signs/body_weight/any_event/body_weight": teza,
			   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemp,
			    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
			    "vital_signs/blood_pressure/any_event/systolic": sistolicniTlak,
			    "vital_signs/blood_pressure/any_event/diastolic": diastolicniTlak,
			    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKisika,
			};
			var parametriZahteve = {
			    ehrId: ehrId,
			    templateId: 'Vital Signs',
			    format: 'FLAT',
			    committer: merilec
			};
			$.ajax({
			    url: baseUrl + "/composition?" + $.param(parametriZahteve),
			    type: 'POST',
			    contentType: 'application/json',
			    data: JSON.stringify(podatki),
			    success: function (res) {
			        $("#dodajMeritveVitalnihZnakovSporocilo").html(
	              "<span class='obvestilo label label-success fade-in'>" +
	              res.meta.href + ".</span>");
			    },
			    error: function(err) {
			    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
	            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
	            JSON.parse(err.responseText).userMessage + "'!");
			    }
			});
		}
}
function generiraj(){
    generirajPodatke(1);
    generirajPodatke(2);
    generirajPodatke(3);
}




 

/**
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 */
function preberiEHRodBolnika() {
	var sessionId = getSessionId();
    var ehrId = $("#preberiEHRid").val();
    
    $("#dodajVitalnoEHR").val("");
	$("#dodajVitalnoDatumInUra").val("");
	$("#dodajVitalnoTelesnaVisina").val("");
	$("#dodajVitalnoTelesnaTeza").val("");
	$("#dodajVitalnoTelesnaTemperatura").val("");
	$("#dodajVitalnoKrvniTlakSistolicni").val("");
	$("#dodajVitalnoKrvniTlakDiastolicni").val("");
	$("#dodajVitalnoNasicenostKrviSKisikom").val("");
	$("#dodajVitalnoMerilec").val("");    
	$("#preberiSporocilo").html("<span id='preberiSporocilo'</span>");

	if (!ehrId || ehrId.trim().length == 0) {
		if($('#preberiPredlogoBolnika').val()!=""){
			$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
    		"fade-in'>Prosim vnesi ehrId!");
		}
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
			   $("#izpisImena").val(party.firstNames);
    			$("#izpisPriimka").val(party.lastNames);
    			$("#izpisDatuma").val(party.dateOfBirth);
    	/*	$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>'" + party.firstNames +"'.</span>");
          	$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>'" + party.lastNames +"'.</span>");
          	$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>'" + party.dateOfBirth +"'.</span>");
          */
			},
		
		});
		$.ajax({
		    url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
	    	    if(data.length > 0){
	    	       // $('#datum').append('<option value=""></option>');
	    	        var meritve = [];
	    	        for(var i in data){
	    	            var check = false;
	    	            for(var j in meritve){
	    	                if(meritve[j] == data[i].time){
	    	                    check = true;
	    	                }
	    	            }
	    	            if(!check)
	    	                $('#datum').append('<option value="'+data[i].time.substring(0, 7)+'">'+data[i].time.substring(0, 7)+'</option>');
	    	        }
	    	    }
	    	},
	    	error: function(err) {
			    	$("#obvestilo").html(
	            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
	            JSON.parse(err.responseText).userMessage + "'!");
			    }
		})
	}
}
 $(document).ready(function(){
     $("#preberiPredlogoBolnika").change(function(){
      $("#kreirajSporocilo").html("");
        var podatki = $(this).val().split(",");
        $("#izpisImena").val(podatki[0]);
            $("#izpisPriimka").val(podatki[1]);
                $("#izpisDatuma").val(podatki[2]);
                    $("#preberiEHRid").val(podatki[3]);
                        preberiEHRodBolnika();
     });
     $('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
	
 });
 