/* 서버 흉내 — 검사에서만 쓴다.

   진짜 Supabase 를 부르지 않고도 「보내는 줄이 어떤 모양인가」,
   「받는 쪽 화면에 뜨는가」 를 끝까지 볼 수 있어야 한다.
   그래서 supabase-js 와 같은 모양으로 이어지는(chainable) 가짜를 만든다.

   쓰는 쪽: page.addInitScript(SB_STUB(테이블별_자료))               */
exports.SB_STUB = function (rows) {
  return `(function(){
    var ROWS = ${JSON.stringify(rows)};
    window.__wrote = [];
    function mk(table){
      var o={_t:table,_single:false,_w:''};
      ['select','eq','neq','gte','lte','order','limit','in','is','maybeSingle'].forEach(function(m){
        o[m]=function(){return o;};
      });
      o.single=function(){o._single=true;return o;};
      ['insert','upsert','update','delete'].forEach(function(m){
        o[m]=function(v){o._w=m;window.__wrote.push({t:table,op:m,v:v});return o;};
      });
      o.then=function(res,rej){
        var out;
        if(o._w)out={data:[{id:'new-1'}],error:null};
        else{
          var d=ROWS[table];
          if(d===undefined)d=[];
          /* {__seq:[첫 번째 답, 두 번째 답, …]} 이면 부를 때마다 다음 것을 준다 —
             「나중에 새 줄이 생긴다」 를 흉내 내는 자리다 */
          if(d&&d.__seq){
            var i=d.__i||0;
            d.__i=Math.min(i+1,d.__seq.length-1);
            d=d.__seq[i];
          }
          out={data:o._single?(d&&d.length?d[0]:d):d,error:null};
        }
        return Promise.resolve(out).then(res,rej);
      };
      return o;
    }
    window.supabase={createClient:function(){
      return {
        auth:{getSession:function(){
          return Promise.resolve({data:{session:{user:{id:ROWS.__me||'me-1'}}}});
        }},
        from:mk
      };
    }};
    /* 알림은 뜬 것을 세기만 한다 */
    window.__notes=[];
    window.Notification=function(t,o){window.__notes.push({t:t,body:(o||{}).body||''});};
    window.Notification.permission='granted';
    window.Notification.requestPermission=function(){return Promise.resolve('granted');};
  })();`;
};
