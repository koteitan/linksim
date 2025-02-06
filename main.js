// fields--------------------
var gW; /* world coordinate */
//entry point--------------------
window.onload = function(){
  initHtml(); //get locale option
  initLink(); //use local option
  initDraw();
  initEvent(canin,canout);
  window.onresize(); //after loading maps
  setInterval(procAll, 1000/frameRate); //enter gameloop
}
//maps-------------------
var outlink;
var initLink=function(){
  //init world
  var m = 0; //default margin
  gW = new Geom(2,[[-150-m,-150-m],[50+m,50+m]]);
  //init example net
  inlink = new Net([
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
  outlink = new Net(inlink);
  applylink();
};
var applylink=function(){
  var pos = inlink.pos.clone();
  var edge = [];
  for(var i=0;i<inlink.pos.length;i++){
    for(var j=i+1;j<inlink.pos.length;j++){
      edge.push([i,j,abs(sub(inlink.pos[i],inlink.pos[j]))]);
    }
  }
  outlink.edge = edge;
  outlink.calcpos("third");
  outlink.edge = inlink.edge.clone();
}
var procLink=function(){
  outlink.angle+=5/180*Math.PI;
  if(outlink.angle>360)outlink.angle-=360;
  outlink.calcpos("prev");
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
    procDraw(canin,ctxin,inlink);
    procDraw(canout,ctxout,outlink);
    isRequestedDraw = true;
  }
}
var initHtml=function(){
  debug = document.getElementById('debug');
}

// html ----------------------------
var debug;
window.onresize = function(){ //browser resize
  var wx,wy;
  var agent = navigator.userAgent;
  var wx= [(canin.getBoundingClientRect().width  -10)*0.99, 320].max();
  var wy= [(canin.getBoundingClientRect().height-300)*0.99,  20].max();
  var w = [wx,wy].max();
  canin.width = w;
  canin.height= w;
  canout.width = w;
  canout.height= w;
  renewgS();
  isRequestedDraw = true;
};
// graphics ------------------------
var ctxin;
var canin;
var ctxout;
var canout;
var gS;
var fontsize = 15;
var radius = 15;
var isRequestedDraw = true;
var isSheetLoaded = false;
var frameRate = 30; //[fps]
//init
var initDraw=function(){
  canin  = document.getElementById("incanvas");
  ctxin  = canin.getContext('2d');
  canout = document.getElementById("outcanvas");
  ctxout = canout.getContext('2d');
  renewgS();
}
var renewgS=function(){
  var s=[[0,canin.height],[canin.width,0]];
  gS = new Geom(2,s);
}
//proc
var procDraw = function(can,ctx,net){
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
  for(var i=0;i<net.edge.length;i++){
    var s0=transPos(net.pos[net.edge[i][0]],gW,gS);
    var s1=transPos(net.pos[net.edge[i][1]],gW,gS);
    ctx.strokeStyle="black";
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(s0[0],s0[1]);
    ctx.lineTo(s1[0],s1[1]);
    ctx.stroke();
  }
  //draw nodes
  for(var i=0;i<net.pos.length;i++){
    var s=transPos(net.pos[i],gW,gS);
    ctx.beginPath();
    ctx.fillStyle="black";
    if(net.fixed.includes(i)) ctx.fillStyle="red";
    if(i==net.sat  ) ctx.fillStyle="blue";
    ctx.arc(s[0],s[1],radius,0,Math.PI*2,false);
    ctx.fill();
  }
}
//event---------------------
var downpos=[-1,-1];// start of drag
var movpos =[-1,-1];// while drag
var isdragnodes=false;
var dragnode=-1;
var handleMouseDown = function(target){
  downpos = transPos(mouseDownPos,gS,gW);
  movpos[0] = downpos[0];
  movpos[1] = downpos[1];
  const r=transScale([radius],gS,gW)[0];
  if(target==canin){
    for(var i=0;i<inlink.pos.length;i++){
      if(abs2(sub(inlink.pos[i],downpos))<r*r){
        dragnode=i;
        isdragnodes=true;
        return;
      }
    }
  }
  isRequestedDraw = true;
}
var handleMouseDragging = function(target){
  movpos = transPos(mousePos,gS,gW);
  if(isdragnodes){
    inlink.pos[dragnode][0]=movpos[0];
    inlink.pos[dragnode][1]=movpos[1];
    applylink();
  }else{
    for(var i=0;i<2;i++){
      for(var d=0;d<2;d++){
        gW.w[i][d] -= movpos[d]-downpos[d];
      }
    }
  }
  isRequestedDraw = true;
}
var handleMouseUp = function(target){
  isRequestedDraw = true;
  isdragnodes=false;
  dragnode=-1;
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
  if(json instanceof Net){
    this.pos = json.pos.clone();
    this.edge = json.edge.clone();
    this.fixed = json.fixed.clone();
    this.sun   = json.sun;
    this.sat   = json.sat;
    this.angle = json.angle;
  }else if(json instanceof Array){
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
Net.prototype.calcpos=function(strategy){
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
        if(to.length>=2){
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
          if(strategy=="prev"){
            pos[i] = (abs2(sub(pp,oldpos))<abs2(sub(pm,oldpos)))?pp:pm;
          }else if(strategy=="third"){
            let dp=0;
            let dm=0;
            for(var j=0;j<to.length;j++){
              let pj=pos[to[j]];
              let lenj=len[j];
              let pppj2=abs2(sub(pp,pj));
              let pmpj2=abs2(sub(pm,pj));
              dp+=Math.abs(pppj2-lenj*lenj);
              dm+=Math.abs(pmpj2-lenj*lenj);
            }
            pos[i] = (dp<dm)?pp:pm;
          }
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





