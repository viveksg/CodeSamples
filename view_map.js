/*
This is sample from one of my projects as a freelancer
This code allows user to create a geofence by specifying coordinates ,radius and message associated with Geofence
First the User login is Verified . Upon successful verification the user is able to view the map
And point to the Coordinates and specify radius and message for the GeoFence.
After the validations these values are sent to server through an ajax request.
Where the record corresponding to the Geofence is created in Geofence.
If the record is created then based on response of the request a circle is drawn to signify that geofence is created
Also a message is also displayed corresponding to status of request.

user can also Edit/delete the geofence by clicking on geofence using the similar process mentioned above
API Used: Goolge Maps API, Toastr API
*/
var latitude;
var longitude;
var radius;
var msg;
var gfid1=-1;
var gfid2=-1;
var host="/";
var selected_circle;
var selected_marker;
var create_disabled;
var edit_disabled;
var delete_disabled;
var geocoder;
var gcmarker;
var fullname;
//create variable for map options to define map properties when the map is loaded
var map_options={
              center: new google.maps.LatLng(51.551459,-0.136185),
              zoom: 8
                }
// declare map variable. This variable will hold map
var map;

// Register the Listener to Handle the Window Load Event .This will call the initialize_map function 
// When the window is loaded
google.maps.event.addDomListener(window,'load',initialize_map);

//Following function will be called when window is loaded
function initialize_map()
{ //Initialize map variable by specifying its container and its properties stored in 'map options'  
  //variable
  geocoder=new google.maps.Geocoder();
  gcmarker=new google.maps.Marker();
  map=new google.maps.Map(document.getElementById("map_container"),map_options);
  var zoom = getCookie("zoom");
  if (zoom != "")
           map.setZoom(1*zoom);
    else   
           setCookie("zoom", ""+8,1);
  var mplat = getCookie("LAT");
  var mplng = getCookie("LNG");  
  if ((mplat != "")&&(mplng!=""))
           map.setCenter(new google.maps.LatLng(1.0*mplat,1.0*mplng));
    else   
           recordCenter();
  google.maps.event.addListener(map,"click",handleClick);
  google.maps.event.addListener(map,"mousemove",function_mouse_over);
  google.maps.event.addListener(map, 'zoom_changed',recordZoom);
  google.maps.event.addListener(map, 'dragend',recordZoom);
  
}
function recordZoom() {
    var zoomLevel = map.getZoom();
    setCookie("zoom", ""+zoomLevel,1);
    recordCenter();
   
  }
function recordCenter()
{
  var mcenter=map.getCenter();
  var mplat=mcenter.lat();
  var mplng=mcenter.lng();
  setCookie("LAT", ""+mplat,1);
  setCookie("LNG", ""+mplng,1);

}
function handleClick(e)
{
  setCoordinates(e.latLng);
  document.getElementById("edit").disabled=true;
  document.getElementById("delete").disabled=true;
  document.getElementById("tmessage").value="";
  document.getElementById("tradius").value="";
}
function function_mouse_over(e)
{
    //setCoordinates(e.latLng);
}
function setCoordinates(latandlng)
{

	latitude=latandlng.lat();
        longitude=latandlng.lng();
        document.getElementById("coordinates").value="LATITUDE: "+String.fromCharCode(13)+latandlng.lat()+String.fromCharCode(13)+"LONGITUDE: "+String.fromCharCode(13)+latandlng.lng();
}
var is_gfence_task_visible=0;
function showDialog(q)
{
  if(q==0)
    {
     $("#gfence_tasks").show();
    }
}
$(document).ready(function(){
$.post(host+"verify.php",{},handlelogout);
  $("#edit").prop('disabled',true);
  $("#delete").prop('disabled',true);
  $("#map_container").click(function(){
  $("#gfence_tasks").css('display','block').animate({
     top:'80%'
   });
    
  });
$("#gcbutton").click(codeAddress);
$("#hide").click(function(){
$("#gfence_tasks").animate({
      top:'100%'
    }); 
});
$("#create").click(function(){

var test_radius1=($("#tradius").val()).trim();
if(!checkIfNumber(test_radius1))
{
	toastr.error("Radius should be a real number");
        return;
}
if(test_radius1<=0)
{
	toastr.error("Radius should greater than 0");
        return;
}
disableAllButton();
radius=(1.0*(test_radius1))/1000;
msg=$("#tmessage").val();
msgreq=msg;
//msgreq.replace('"','\"');
//msgreq.replace("'","\'");
msgreq=encodeURIComponent(msgreq);
$.post(host+"insert.php",{lat:latitude,
             long:longitude,
             rad:radius,
             mess:msgreq,
             ftype:1},
handleResponse);
});

$("#edit").click(function(){

var test_radius1=($("#tradius").val()).trim();
if(!checkIfNumber(test_radius1))
{
	toastr.error("Radius should be a real number");
        return;
}
if(test_radius1<=0)
{
	toastr.error("Radius should greater than 0");
        return;
}
disableAllButton();
radius=(1.0*(test_radius1))/1000;
msg=$("#tmessage").val();
msgreq=msg;
//msgreq.replace('"','\"');
//msgreq.replace("'","\'");
msgreq=encodeURIComponent(msgreq);
$.post(host+"insert.php",{lat:latitude,
             long:longitude,
             rad:radius,
             mess:msgreq,
             ftype:2,
             id1: gfid1,
             id2: gfid2,
             },
handleEditResponse);

});

$("#delete").click(function(){
disableAllButton();
$.post(host+"insert.php",{ftype:3,id1:gfid1,id2:gfid2},handleDeleteResponse);
});
$("#logout").click(function(){
$.post(host+"login.php",{ftype:3},handlelogout);
});
});
function handleResponse(Data,Status)
{ //alert(Data);

 var data_json=JSON.parse(Data);
 //alert(""+data_json.DATA[0].success);
 if(data_json.DATA[0].success==1)
 {
 create_circle(latitude,longitude,radius,data_json,msg);
 toastr.success("Geo-Fence Created");
 }
 else if(data_json.DATA[0].success==-3)
 toastr.error("Can't create the circle. User Limit Exceeded.");
 else
 toastr.error("Can't create the circle. Possible Duplicate.");
gcmarker.setMap(null);
restoreButtonsState();
}
function create_circle(x,y,circle_radius,data_json,messg)
{//alert("InCircle");  	
var circle=new google.maps.Circle({
		center: new google.maps.LatLng(x,y),
	        radius:  circle_radius*1000,
	        strokeColor:"#00FF00",
	        strokeOpacity:0.8,
	        strokeWeight: 2,
	        fillColor: "#00FF00",
	        fillOpacity:0.35
	});
        
	circle.setMap(map);
	google.maps.event.addListener(circle,"click",handleClick);

var marker=new google.maps.Marker();
marker.setPosition(circle.getCenter());
marker.setAnimation(google.maps.Animation.DROP);
marker.setMap(map);
google.maps.event.addListener(marker,"click",function(e){handleCircle(e.latLng,circle,data_json,messg,marker);});

}
function handleCircle(latandlng,circle_obj,jdata,messg,marker_obj)
{       
	//alert(circle_obj.getRadius()+" "+jdata.DATA[2].ID+" "+messg+" len: "+jdata.length);
        latitude=latandlng.lat();
        longitude=latandlng.lng();
	document.getElementById("coordinates").value="LATITUDE: "+String.fromCharCode(13)+latandlng.lat()+String.fromCharCode(13)+"LONGITUDE: "+String.fromCharCode(13)+latandlng.lng();
        document.getElementById("tmessage").value=messg;
        document.getElementById("tradius").value=circle_obj.getRadius();
        circle_latlng=circle_obj.getCenter();
        lat1=circle_latlng.lat();
        lng1=circle_latlng.lng();
        if(lat1==latitude&&lng1==longitude)
        {// alert("status"+document.getElementById("edit").disabled);
        document.getElementById("edit").disabled=false;
        document.getElementById("delete").disabled=false;
        }
        gfid1=jdata.DATA[2].ID;
        gfid2=jdata.DATA[1].length>1?jdata.DATA[3].ID:-1;
       // alert(gfid1+" "+gfid2);
        selected_circle=circle_obj;
        selected_marker=marker_obj;
        if(messg.length>0)
        {
        var infowindow=new google.maps.InfoWindow();
        infowindow.setContent("Message: "+messg);
        infowindow.open(map,marker_obj);
        }
}
function handleDeleteResponse(Data,Status)
{ 
  var jdata=JSON.parse(Data);
  if(jdata.DATA[0].success==1)
  {//alert(Data);
   map_delete();
   toastr.success("Geo-Fence successfully deleted"); 
  }
  else
    toastr.error("Unable to delete Geo-Fence "); 
 restoreButtonsState();

}

function map_delete()
{
  selected_marker.setMap(null);
  selected_circle.setMap(null);
  document.getElementById("tmessage").value="";
  document.getElementById("tradius").value="";
  gcmarker.setMap(null);
}

function handleEditResponse(Data,Status)
{
 var data_json=JSON.parse(Data);
 //alert(""+data_json.DATA[0].success);
 if(data_json.DATA[0].success==1)
 {map_delete();
 create_circle(latitude,longitude,radius,data_json,msg);
 toastr.success("Geo-Fence successfully modified");
 }
 else
 toastr.error("Can't modify the Geo-Fence.");
gcmarker.setMap(null);
restoreButtonsState();
}

function setCookie(cname, cvalue,remove) {
    var date = new Date();
    date.setTime(date.getTime() + (remove*(24*60*60*1000)));
    var expires = "expires="+date.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
} 
function getCookie(cname) {
    var name = cname + "=";
    var cset = document.cookie.split(';');
    for(var i=0; i<cset.length; i++) {
        var c = cset[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
} 


function disableAllButton()
{
 create_disabled=document.getElementById("create").disabled;
 edit_disabled=document.getElementById("edit").disabled;
 delete_disabled=document.getElementById("delete").disabled;
 document.getElementById("create").disabled=true;
 document.getElementById("edit").disabled=true;
 document.getElementById("delete").disabled=true;
}
function restoreButtonsState()
{
 document.getElementById("create").disabled=create_disabled;
 document.getElementById("edit").disabled=edit_disabled;
 document.getElementById("delete").disabled=delete_disabled;
}

function handlelogout(Data,Status)
{
 if(Data==3)logout();
 else {   
	 fullname=Data;
	 var loggedin = getCookie("loggedin");
	 if (loggedin == "")
	 { setCookie("loggedin","1",1);	 
	  toastr.success("Hello "+fullname);
	 }
	 
      }	 

}
function logout(){
toastr.success("Good Bye "+fullname);
setCookie("zoom","",-1);
setCookie("LAT","",-1);
setCookie("LNG","",-1);
setCookie("loggedin","",-1);	 
window.location.assign("login.html");
}

function checkIfNumber(test_numx)
{
test_num=test_numx.trim();	
var len=test_num.length;
if(len==0)return false;
var i=0;
var j=0;
var strt="";
j=test_num.indexOf('.');
if(j!=test_num.lastIndexOf('.'))
 return false;
for(i=0;i<len;i++)
 { if(i==j)continue;
   strt=""+test_num.charAt(i);
   if(!(/[0-9]/.test(strt)))return false;
  
 }
return true;

}


function codeAddress()
{
 var address=document.getElementById("gctext").value;
 var image="images/pin2.png";
 geocoder.geocode({'address':address}, function (result,gstatus){
  if(gstatus==google.maps.GeocoderStatus.OK)
  { 
    map.setCenter(result[0].geometry.location);
    gcmarker.setPosition(result[0].geometry.location);
    gcmarker.setIcon(image);
    gcmarker.setMap(map);
    var mlat=result[0].geometry.location.lat();
    var mlong=result[0].geometry.location.lng();
document.getElementById("coordinates").value="LATITUDE: "+String.fromCharCode(13)+mlat+String.fromCharCode(13)+"LONGITUDE: "+String.fromCharCode(13)+mlong;

document.getElementById("tradius").value="10";   
latitude=mlat;
longitude=mlong;
radius=10;
google.maps.event.addListener(gcmarker,"click",function(e){
       	document.getElementById("coordinates").value="LATITUDE: "+String.fromCharCode(13)+mlat+String.fromCharCode(13)+"LONGITUDE: "+String.fromCharCode(13)+mlong;
        document.getElementById("tradius").value="10";   
        latitude=mlat;
        longitude=mlong;
        radius=10;      });
  }
  else
   toastr.info("Unable to Geo-code due to following reasons"+String.fromCharCode(13)+gstatus);
  
 });
}
