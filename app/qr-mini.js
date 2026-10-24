/* ══════════════════════════════════════════════════════════════════
   qr-mini.js — 바깥 셈틀 없이 QR 을 그리는 작은 한 벌 (판 X180)

   설계사가 만든 「내 셀프 점검 링크」 를 고객 폰 카메라로 바로 열게 하려고
   세웠습니다. 바깥 라이브러리를 들이지 않습니다(10번) — 그래서 표준
   (ISO/IEC 18004) 그대로 손으로 짰습니다.
     · 바이트 모드 · 오류 정정 M · 판 1~20 (UTF-8 666바이트까지)
     · 마스크 여덟 가운데 벌점이 가장 낮은 것
   ★ 맞는지는 scripts/check-qrmini.js 가 잽니다 — 표준 구현(segno)이
     같은 글·같은 판·같은 마스크로 만든 칸과 <b>한 칸도 다르지 않은지</b>.

   쓰는 법:  qrMini.svg('https://…')  → <svg …> 글
             qrMini.matrix('https://…') → {size, version, mask, m:[[0/1…]…]}
   ES5 로 씁니다(본체와 같은 규칙).
   ══════════════════════════════════════════════════════════════════ */
(function(){
  /* 오류 정정 M — 판마다 블록당 정정 코드 수 · 블록 수 (표준 표 7·9) */
  var ECC_M=[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26];
  var BLK_M=[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16];
  var MAXV=20;

  function rawModules(v){
    var r=(16*v+128)*v+64;
    if(v>=2){var n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36;}
    return r;
  }
  function dataCodewords(v){return Math.floor(rawModules(v)/8)-ECC_M[v]*BLK_M[v];}
  function utf8(s){
    var b=[],i,c;
    s=unescape(encodeURIComponent(s));
    for(i=0;i<s.length;i++){c=s.charCodeAt(i);b.push(c&255);}
    return b;
  }
  /* GF(2^8) · 원시 다항식 0x11D */
  function mul(x,y){var z=0,i;for(i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x;}return z&255;}
  function rsDivisor(d){
    var r=[],i,j,root=1;for(i=0;i<d;i++)r.push(0);r[d-1]=1;
    for(i=0;i<d;i++){for(j=0;j<d;j++){r[j]=mul(r[j],root);if(j+1<d)r[j]^=r[j+1];}root=mul(root,2);}
    return r;
  }
  function rsRemainder(data,div){
    var r=[],i,j,f;for(i=0;i<div.length;i++)r.push(0);
    for(i=0;i<data.length;i++){f=data[i]^r.shift();r.push(0);for(j=0;j<div.length;j++)r[j]^=mul(div[j],f);}
    return r;
  }
  function alignPos(v){
    if(v===1)return[];
    var n=Math.floor(v/7)+2,size=v*4+17,step=Math.ceil((v*4+4)/(n*2-2))*2,r=[6],p;
    for(p=size-7;r.length<n;p-=step)r.splice(1,0,p);
    return r;
  }

  function build(text,force){
    var bytes=utf8(text),v,cap,bits=[],i,j;
    for(v=1;v<=MAXV;v++){cap=dataCodewords(v)*8;if(4+(v<10?8:16)+bytes.length*8<=cap)break;}
    if(v>MAXV)return null;                         /* 너무 긴 글 — 지어 자르지 않는다 */
    function put(val,len){for(var k=len-1;k>=0;k--)bits.push((val>>>k)&1);}
    put(4,4);put(bytes.length,v<10?8:16);
    for(i=0;i<bytes.length;i++)put(bytes[i],8);
    put(0,Math.min(4,cap-bits.length));
    put(0,(8-bits.length%8)%8);
    for(i=0xEC;bits.length<cap;i^=0xEC^0x11)put(i,8);
    var data=[];for(i=0;i<bits.length;i+=8){var b=0;for(j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b);}
    /* 블록으로 나눠 정정 코드를 붙이고 엇갈려 담는다 */
    var nb=BLK_M[v],el=ECC_M[v],raw=Math.floor(rawModules(v)/8),nShort=nb-raw%nb,sLen=Math.floor(raw/nb),
        div=rsDivisor(el),blocks=[],k=0;
    for(i=0;i<nb;i++){
      var d=data.slice(k,k+sLen-el+(i<nShort?0:1));k+=d.length;
      var e=rsRemainder(d,div);if(i<nShort)d.push(0);
      blocks.push(d.concat(e));
    }
    var cw=[];
    for(i=0;i<blocks[0].length;i++)for(j=0;j<nb;j++)if(i!==sLen-el||j>=nShort)cw.push(blocks[j][i]);

    var size=v*4+17,M=[],F=[];
    for(i=0;i<size;i++){M.push([]);F.push([]);for(j=0;j<size;j++){M[i].push(0);F[i].push(0);}}
    function fn(x,y,dark){M[y][x]=dark?1:0;F[y][x]=1;}
    for(i=0;i<size;i++){fn(6,i,i%2===0);fn(i,6,i%2===0);}
    function finder(cx,cy){
      for(var dy=-4;dy<=4;dy++)for(var dx=-4;dx<=4;dx++){
        var d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;
        if(x>=0&&x<size&&y>=0&&y<size)fn(x,y,d!==2&&d!==4);
      }
    }
    finder(3,3);finder(size-4,3);finder(3,size-4);
    var ap=alignPos(v),n=ap.length;
    for(i=0;i<n;i++)for(j=0;j<n;j++){
      if((i===0&&j===0)||(i===0&&j===n-1)||(i===n-1&&j===0))continue;
      for(var ay=-2;ay<=2;ay++)for(var ax=-2;ax<=2;ax++)fn(ap[i]+ax,ap[j]+ay,Math.max(Math.abs(ax),Math.abs(ay))!==1);
    }
    function formatBits(mask){
      var d=(0<<3)|mask,r=d;                      /* M 은 00 */
      for(var q=0;q<10;q++)r=(r<<1)^((r>>>9)*0x537);
      return((d<<10)|r)^0x5412;
    }
    function drawFormat(mask){
      var b=formatBits(mask),q,g=function(t){return(b>>>t)&1;};
      for(q=0;q<=5;q++)fn(8,q,g(q));
      fn(8,7,g(6));fn(8,8,g(7));fn(7,8,g(8));
      for(q=9;q<15;q++)fn(14-q,8,g(q));
      for(q=0;q<8;q++)fn(size-1-q,8,g(q));
      for(q=8;q<15;q++)fn(8,size-15+q,g(q));
      fn(8,size-8,1);
    }
    drawFormat(0);                                  /* 자리만 잡아 둔다 */
    if(v>=7){
      var r=v,q;for(q=0;q<12;q++)r=(r<<1)^((r>>>11)*0x1F25);
      var vb=(v<<12)|r;
      for(q=0;q<18;q++){var bit=(vb>>>q)&1,a=size-11+q%3,c=Math.floor(q/3);fn(a,c,bit);fn(c,a,bit);}
    }
    /* 지그재그로 담는다 */
    var idx=0,right,vert,x,y,up;
    for(right=size-1;right>=1;right-=2){
      if(right===6)right=5;
      for(vert=0;vert<size;vert++)for(j=0;j<2;j++){
        x=right-j;up=((right+1)&2)===0;y=up?size-1-vert:vert;
        if(!F[y][x]&&idx<cw.length*8){M[y][x]=(cw[idx>>>3]>>>(7-(idx&7)))&1;idx++;}
      }
    }
    function maskFn(mk,x,y){
      switch(mk){
        case 0:return(x+y)%2===0;case 1:return y%2===0;case 2:return x%3===0;case 3:return(x+y)%3===0;
        case 4:return(Math.floor(x/3)+Math.floor(y/2))%2===0;case 5:return x*y%2+x*y%3===0;
        case 6:return(x*y%2+x*y%3)%2===0;default:return((x+y)%2+x*y%3)%2===0;
      }
    }
    function applyMask(mk){for(var yy=0;yy<size;yy++)for(var xx=0;xx<size;xx++)if(!F[yy][xx]&&maskFn(mk,xx,yy))M[yy][xx]^=1;}
    function penalty(){
      var p=0,yy,xx,run,c,dark=0,line,s;
      for(var dir=0;dir<2;dir++)for(yy=0;yy<size;yy++){
        run=1;
        for(xx=1;xx<size;xx++){
          var a0=dir?M[xx-1][yy]:M[yy][xx-1],a1=dir?M[xx][yy]:M[yy][xx];
          if(a1===a0){run++;if(run===5)p+=3;else if(run>5)p++;}else run=1;
        }
        line='';for(xx=0;xx<size;xx++)line+=(dir?M[xx][yy]:M[yy][xx]);
        s='0000'+line+'0000';
        for(c=s.indexOf('1011101');c>=0;c=s.indexOf('1011101',c+1)){
          if(s.substr(c-4,4)==='0000'||s.substr(c+7,4)==='0000')p+=40;
        }
      }
      for(yy=0;yy<size-1;yy++)for(xx=0;xx<size-1;xx++){
        c=M[yy][xx];if(c===M[yy][xx+1]&&c===M[yy+1][xx]&&c===M[yy+1][xx+1])p+=3;
      }
      for(yy=0;yy<size;yy++)for(xx=0;xx<size;xx++)dark+=M[yy][xx];
      p+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10;
      return p;
    }
    var best=0,bestP=1e9,mk;
    if(force>=0&&force<8){best=force;bestP=-1;}
    else for(mk=0;mk<8;mk++){applyMask(mk);drawFormat(mk);var pp=penalty();if(pp<bestP){bestP=pp;best=mk;}applyMask(mk);}
    applyMask(best);drawFormat(best);
    return{size:size,version:v,mask:best,m:M};
  }

  function svg(text,opt){
    opt=opt||{};
    var q=build(text);if(!q)return '';
    var B=opt.border==null?2:opt.border,N=q.size+2*B,d='',x,y;
    for(y=0;y<q.size;y++)for(x=0;x<q.size;x++)if(q.m[y][x])d+='M'+(x+B)+' '+(y+B)+'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+N+' '+N+'" shape-rendering="crispEdges" role="img" aria-label="'+(opt.label||'QR 코드')+'">'+
      '<rect width="'+N+'" height="'+N+'" fill="#fff"/><path fill="'+(opt.dark||'#191F28')+'" d="'+d+'"/></svg>';
  }
  window.qrMini={svg:svg,matrix:build};
})();
