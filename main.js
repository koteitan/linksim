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
  var m = 0.1; //default margin
  gW = new Geom(2,[[0-m,0-m],[1+m,1+m]]);
  //init example net
  mainlink = new Net([
    [//edge[i]=[from,to,len]
      [0,1,15],
      [1,2,50],
      [1,3,61.9],
      [2,4,41.5],
      [2,5,55.8],
      [3,6,36.7],
      [3,7,49.0],
      [4,5,40.1],
      [5,6,39.4],
      [6,7,65.7],
    ],//link
    [0,4],//fixed
    [[0,0],[-38.0,+7.8]],//fixedpos
    0,//sun
    1,//sat
    0,//angle
  ]);
};
/* continued from main(). */
var initMaps2=function(res){
  isRequestedDraw = true;
}
//game loop ------------------
var procAll=function(){
  procEvent();
  if(isRequestedDraw){
    procDraw();
    isRequestedDraw = false;
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
  var wy= [(document.documentElement.clientHeight-200), 20].max();
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
var frameRate = 60; //[fps]
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

  //draw nodes
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
      gW.w[i][d] = (oldw[i][d]-pos[d])*Math.pow(1.1, -mouseWheel[1]/1000)+pos[d];
    }
  }
  gW.recalc();
  isRequestedDraw = true;
}

var Net=function(json){
  if(typeof json!="undefined"){
    var obj=JSON.parse(json);
    var i=0;
    this.edge = obj[i++]; 
      /* edge[i] = [from,to,len]
       *  from = node index the node had the ith edge from
       *  to   = node index the node had the ith edge to
       *  len  = length of the ith edge */
    this.fixed  = obj[i++]; /* fixed[i] = the index of ith fixed node. */
    this.fixpos = obj[i++]; /* fixed[i][{0,1}] = {x,y} position of the ith fixed node. */
    this.sun    = obj[i++]; /* sat      = the index of ith satellite node. */
      /* "the sun node" is the node satellite node rotate around. */
    this.sat    = obj[i++]; /* sat      = the index of ith satellite node. */
      /* "the satellite node" is the node which rotate around the satfix node
       * to be the motion source.*/
    this.angle  = obj[i++]; /* angle = the angle in radian of the satellite node. */
  }
}

var Net.prototype.calcpos=function(){
  var sat=this.sat;
  var sun=this.sun;
  var edges=this.edge.length;
  var nodes=this.edge.max().max();
  var pos=new Array(nodes);
  var done=new Array(nodes);
  for(var i=0;i<nodes;i++)done[i]=false;
  //set pos of fixed
  this.fixed.foreach(function(f,i){
    pos[f]=this.fixpos[i];
    done[f]=true;
  });
  //set pos of sat
  var satsunlen=this.getlength(sat,sun);
  pos[sat]=[
    satsunlen*Math.cos(this.angle);
    satsunlen*Math.sin(this.angle);
  ];
  done[san]=true;

  //iterate others
  do{
    var isloop=false;
    for(var i=0;i<nodes;i++){
      if(!done[i]){
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
          var X0=pos[to[0]][0];
          var Y0=pos[to[0]][1];
          var xm=pos[i][0];
          var ym=pos[i][1];
          var X1=pos[to[1]][0];
          var Y1=pos[to[1]][1];
          var R0=len[0];
          var R1=len[1];
          /*
            (xm-X0)^2+(ym-Y0)^2=R0^2
            (xm-X1)^2+(ym-Y1)^2=R1^2
            xm^2-2xmX0+X0^2+ym^2-2ymY0+Y0^2=R0^2
            xm^2-2xmX1+X1^2+ym^2-2ymY1+Y1^2=R1^2
            xm(X0+X1)+ym(Y0+Y1)=(R0^2+R1^2)/2
            xmX+ymY=R
           */
          var X=X0+X1;
          var Y=Y0+Y1;
          var R=(R0*R0+R1*R1)/2;
          /* 
            ym=(R-xmX)/Y
            (1+X^2/Y^2)xm^2+xm(-2X0+2XY0/Y)-2RY0/Y+Y0^2+X0^2+R^2/Y^2-R0^2=0
          */
          done[i]==true;
        }else{
        }
      }
    }
  }while(isloop);
}





