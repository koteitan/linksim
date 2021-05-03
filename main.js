// fields--------------------
// maps
var maps;
var spreadsheetId = "11WH6PrhFAcdMEWSTjxSjZ7_rWHg-b8shAvSFn99bdyQ"; // for live
//var spreadsheetId = "1foxx3dOYDwnyqQsxmhmcWV93xvCzOxX73GCg8Bv-kg0";
var gW; /* world coordinate */
//entry point--------------------
window.onload = function(){
  initHtml(); //get locale option
  initLink(); //use local option
  initDraw();
  initEvent(can);
  window.onresize(); //after loading maps
  setInterval(procAll, 1000/frameRate); //enter gameloop
}
//maps-------------------
var mainlink;
var initLink=function(){
  //init world
  var m = 0; //default margin
  gW = new Geom(2,[[-150-m,-150-m],[50+m,50+m]]);
  //init example net
  mainlink = new Net([
    [//pos[i]=[x,y]
      [  0,   0], //0
      [ -7, +13], //1
      [-60, +30], //2
      [-30, -50], //3
      [-38, -7.8],//4
      [-85, -20], //5
      [-70, -65], //6
      [  0,-100], //7
    ],
    [ //edge[i]=[from,to,(len)]
      [0,1, 15.0],
      [1,2, 50.0],
      [1,3, 61.9],
      [2,4, 41.5],
      [3,4, 39.3],
      [4,5, 40.1],
      [2,5, 55.8],
      [3,6, 36.7],
      [5,6, 39.4],
      [3,7, 49.0],
      [6,7, 65.7],
    ],//link
    [0,4],//fixed
    0,//sun
    1,//sat
    Math.PI/3*2,//angle
  ]);
};
var procLink=function(){
  mainlink.angle+=5/180*Math.PI;
  if(mainlink.angle>360)mainlink.angle-=360;
  mainlink.calcpos();
}
/* continued from main(). */
var initMaps2=function(res){
  isRequestedDraw = true;
}
//game loop ------------------
var procAll=function(){
  procLink();
  procEvent();
  if(isRequestedDraw){
    procDraw();
    isRequestedDraw = true;
  }
}
var initHtml=function(){
  debug = document.getElementById('debug');
  if(navigator.language=='ja'){
    document.getElementsByName('locale')[1].checked = true;
  }
}

// html ----------------------------
var debug;
window.onresize = function(){ //browser resize
  var wx,wy;
  var agent = navigator.userAgent;
  var wx= [(document.documentElement.clientWidth-10)*0.99, 320].max();
  var wy= [(document.documentElement.clientHeight-300), 20].max();
  document.getElementById("outcanvas").width = wx;
  document.getElementById("outcanvas").height= wy;
  renewgS();
  isRequestedDraw = true;
};
var changelocale=function(){ // form option button
  isRequestedDraw = true;
}
// graphics ------------------------
var ctx;
var can;
var gS;
var fontsize = 15;
var radius = 15;
var isRequestedDraw = true;
var isSheetLoaded = false;
var frameRate = 30; //[fps]
//init
var initDraw=function(){
  can = document.getElementById("outcanvas");
  ctx = can.getContext('2d');
  renewgS();
}
var renewgS=function(){
  var s=[[0,can.height],[can.width,0]];
  gS = new Geom(2,s);
}
//proc
var procDraw = function(){

  //background
  ctx.fillStyle="white";
  ctx.fillRect(0,0,can.width, can.height);

  //grid line -----------------------
  //get screen in world coordinate
  var scr = [transPos([0,can.height], gS, gW), transPos([can.width,0], gS, gW)];
  var base=8;
  var L=Math.log10(scr[1][0]-scr[0][0])/Math.log10(base);
  var intL=Math.floor(L);
  var fracL=L-intL;
  var intL =Math.pow(base,intL);
  var fracL=Math.pow(base,fracL)/base;
  var depths = 3;
  //debug.innerHTML = "intL="+intL+"\n";
  //debug.innerHTML += "fracL="+fracL+"\n";
  for(var depth=depths-1;depth>=0;depth--){
    var qw = intL/Math.pow(base,depth);
    var c = Math.floor(((depth+fracL)/depths)*64+64+127);
    //debug.innerHTML += "c("+depth+") = "+c+"\n";
    ctx.lineWidth=1;
    ctx.strokeStyle='rgb('+c+','+c+','+c+')';
    for(var d=0;d<gW.dims;d++){
      var q0 = Math.floor((scr[0][d])/qw)*qw;
      var q1 = Math.ceil ((scr[1][d])/qw)*qw;

      for(var q=q0;q<q1;q+=qw){
        var wq = scr.clone();
        wq[0][d]=q;
        wq[1][d]=q;
        var sq = [transPosInt(wq[0],gW,gS), transPosInt(wq[1],gW,gS)];
        ctx.beginPath();
        ctx.moveTo(sq[0][0],sq[0][1]);
        ctx.lineTo(sq[1][0],sq[1][1]);
        ctx.stroke();
      }//q
    }//depth
  }//d

  //draw edges
  for(var i=0;i<mainlink.edge.length;i++){
    var s0=transPos(mainlink.pos[mainlink.edge[i][0]],gW,gS);
    var s1=transPos(mainlink.pos[mainlink.edge[i][1]],gW,gS);
    ctx.strokeStyle="black";
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(s0[0],s0[1]);
    ctx.lineTo(s1[0],s1[1]);
    ctx.stroke();
  }
  //draw nodes
  for(var i=0;i<mainlink.pos.length;i++){
    var s=transPos(mainlink.pos[i],gW,gS);
    ctx.beginPath();
    ctx.fillStyle="black";
    if(mainlink.fixed.includes(i)) ctx.fillStyle="red";
    if(i==mainlink.sat  ) ctx.fillStyle="blue";
    ctx.arc(s[0],s[1],10,0,Math.PI*2,false);
    ctx.fill();
  }
}
//event---------------------
var downpos=[-1,-1];// start of drag
var movpos =[-1,-1];// while drag
var handleMouseDown = function(){
  downpos = transPos(mouseDownPos,gS,gW);
  movpos[0] = downpos[0];
  movpos[1] = downpos[1];
}
var handleMouseDragging = function(){
  movpos = transPos(mousePos,gS,gW);
  for(var i=0;i<2;i++){
    for(var d=0;d<2;d++){
      gW.w[i][d] -= movpos[d]-downpos[d];
    }
  }
  isRequestedDraw = true;
}
var handleMouseUp = function(){
  isRequestedDraw = true;
}
var handleMouseWheel = function(){
  var pos=transPos(mousePos,gS,gW);
  var oldw=gW.w.clone();
  for(var i=0;i<2;i++){
    for(var d=0;d<2;d++){
      gW.w[i][d] = (oldw[i][d]-pos[d])*Math.pow(2.1, -mouseWheel[1]/1000)+pos[d];
    }
  }
  gW.recalc();
  isRequestedDraw = true;
}

var Net=function(json){
  if(typeof json!="undefined"){
    var obj=JSON.parse(json);
    var i=0;
    this.pos = obj[i++];
      /* pos[i][{0,1}] = {x,y} positon of the ith node.*/
    this.edge = obj[i++]; 
      /* edge[i] = [from,to,len]
       *  from = node index the node had the ith edge from
       *  to   = node index the node had the ith edge to
       *  len  = length of the ith edge (caluculated by pos if there is no info) */
    this.fixed  = obj[i++]; /* fixed[i] = the index of ith fixed node. */
    this.sun    = obj[i++]; /* sat      = the index of ith satellite node. */
      /* "the sun node" is the node satellite node rotate around. */
    this.sat    = obj[i++]; /* sat      = the index of ith satellite node. */
      /* "the satellite node" is the node which rotate around the satfix node
       * to be the motion source.*/
    this.angle  = obj[i++]; /* angle = the angle in radian of the satellite node. */
  }
  for(var i=0;i<this.edge.length;i++){
    if(this.edge[i].length==2){//if there is no len
      //make len from pos
      var p0=this.pos[this.edge[i][0]];
      var p1=this.pos[this.edge[i][1]];
      this.edge[i].push(Math.sqrt((p1[0]-p0[0])*(p1[0]-p0[0])+(p1[1]-p0[1])*(p1[1]-p0[1])));
    }
  }
}
Net.prototype.calcpos=function(){
  var sat=this.sat;
  var sun=this.sun;
  var nodes=this.pos.length;
  var edges=this.edge.length;
  var pos=new Array(nodes); //new position
  var done=new Array(nodes);
  for(var i=0;i<nodes;i++)done[i]=false;
  //set pos of fixed
    for(var f=0;f<this.fixed.length;f++){
      pos[this.fixed[f]]=this.pos[this.fixed[f]].clone();
      done[this.fixed[f]]=true;
    }
  //set pos of sat
  done[sat]=true;
  var satsunlen=this.getlength(sat,sun);
  pos[sat]=[
    satsunlen*Math.cos(this.angle),
    satsunlen*Math.sin(this.angle)
  ];

  //iterate others
  do{
    var isloop=false;
    for(var i=0;i<nodes;i++){
      if(!done[i]){//not yet
        //find i in edge
        var to=[];
        var len=[];
        for(var e=0;e<edges;e++){
          if(this.edge[e][0]==i && done[this.edge[e][1]]){
            to.push(this.edge[e][1]);
            len.push(this.edge[e][2]);
          }
          if(this.edge[e][1]==i && done[this.edge[e][0]]){
            to.push(this.edge[e][0]);
            len.push(this.edge[e][2]);
          }
        }
        if(to.length==2){
          var P0=pos[to[0]];
          var P1=pos[to[1]];
          var R0=len[0];
          var R1=len[1];
          var P1sP0=sub(P1,P0);
          var R01_2=abs2(P1sP0);
          var R01  =Math.sqrt(R01_2);
          var cos=(R01_2+R0*R0-R1*R1)/(2*R01*R0);
          var sin=Math.sqrt(1-cos*cos);
          var pp=add(mulkv(R0/R01, mulxv([[cos,-sin],[+sin,cos]],P1sP0)),P0);
          var pm=add(mulkv(R0/R01, mulxv([[cos,+sin],[-sin,cos]],P1sP0)),P0);
          var oldpos=this.pos[i];
          pos[i] = (abs2(sub(pp,oldpos))<abs2(sub(pm,oldpos)))?pp:pm;
          done[i] = true;
        }
      }
    }
  }while(done.includes(false));
  this.pos=pos.clone();
}
Net.prototype.getlength=function(a,b){
  for(var i=0;i<this.edge.length;i++){
    if((this.edge[i][0]==a && this.edge[i][1]==b)||
       (this.edge[i][0]==b && this.edge[i][1]==a)){
      return this.edge[i][2];
    }
  }
  return -1;
}





