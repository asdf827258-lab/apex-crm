/*
 * APEX YUN PRO — 🧭 상품전략기 「📥 자료함」 (판 X386)
 * ════════════════════════════════════════════════════════════════════════
 * 2026-11-09 · 사장님 말씀 「우리 메인세션 crm 어플에다가, 넣어서 할순 없을까?
 * 내가 넣으면 복사본을 너가 장소 모아두는 곳에 복사해서 사본을 만들고 저장하여
 * 공유토록」.
 *
 * 다음 달 상품 인사이트에 쓸 소식지·약관 PDF 를 어느 컴퓨터·폰에서든 CRM 에
 * 넣으면, 사장님 PC 의 apex-insight 가 pull_sources.py 로 가져가 만든다.
 *
 *   CRM(여기) ──올림──▶ Supabase 저장 칸 insight-src (비공개 · 로그인한 사람만)
 *                       + 목록 insight_sources (누가 · 무엇을 · 언제)
 *   사장님 PC ──edge insight-pull──▶ 내려받기 → ★서버 사본 삭제 → 목록에 ✓
 *
 * ★ 우편함이지 보관함이 아니다. 「원수사 약관을 서버에 올리지 않는다」(CLAUDE.md 9번)
 *   — 사장님이 고르신 길: <b>PC 가 받으면 지운다</b>. 그래서 여기엔 「열기」가
 *   가져가기 전까지만 선다.
 * ★ 같은 파일 두 번 안 받음(5-1번) — 바이트 지문(SHA-256)이 같으면 올리지 않고
 *   「누가 언제 올린 것과 같은지」 말한다.
 * ★ 저장 칸 주소는 영문만(월/시각_지문.pdf). 한글 파일 이름은 목록에만 둔다 —
 *   Supabase 저장 칸이 한글 키를 거절하는 일이 있다.
 * ★ 서버는 자료함을 열 때 <b>한 번</b>만 부른다(7번). 되풀이 없음.
 *
 * app/index.html 은 여럿이 고치므로 거기엔 <script> 한 줄만 둔다. 이름은 iib*.
 */
(function(){
  var IIB_BUCKET='insight-src';
  var IIB_KIND={news:'소식지',terms:'약관',etc:'기타'};
  var IIB={kind:'news',rows:null,busy:0};

  function iibEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function iibSb(){try{return (typeof osClient==='function')?osClient():null;}catch(e){return null;}}
  function iibUid(){try{return OS.session.user.id;}catch(e){return null;}}
  function iibIsAdmin(){try{var r=OS.profile&&OS.profile.role;return r==='admin'||r==='owner';}catch(e){return false;}}
  function iibToast(m,ms){if(typeof toast==='function')toast(m,ms);}
  function iibMonthNow(){var d=new Date(Date.now()+9*3600e3);var m=d.getUTCMonth()+1;return d.getUTCFullYear()+'-'+(m<10?'0':'')+m;}
  function iibSize(n){if(!n&&n!==0)return '';return n>=1048576?(n/1048576).toFixed(1)+'MB':Math.max(1,Math.round(n/1024))+'KB';}
  function iibWhen(t){try{var d=new Date(new Date(t).getTime()+9*3600e3);return (d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+('0'+d.getUTCHours()).slice(-2)+':'+('0'+d.getUTCMinutes()).slice(-2);}catch(e){return '';}}

  var CSS=''+
  '.iib-open{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.14);color:#fff;border:none;border-radius:var(--r-pill);font-size:var(--t6);font-weight:800;padding:8px 13px;cursor:pointer;letter-spacing:-.02em;font-family:inherit}'+
  '.iib-open:hover{background:rgba(255,255,255,.24)}'+
  '#iibWrap{position:fixed;inset:0;z-index:400;background:rgba(15,23,42,.45);display:none;align-items:flex-start;justify-content:center;padding:6vh 16px 16px;overflow:auto;font-family:var(--t-font)}'+
  '#iibWrap.on{display:flex}'+
  '.iib-card{width:100%;max-width:560px;background:var(--t-card);color:var(--t-ink);border-radius:var(--t-r);box-shadow:0 20px 50px rgba(15,23,42,.25);padding:22px 20px 18px}'+
  '.iib-hd{display:flex;align-items:flex-start;gap:10px}'+
  '.iib-hd h3{margin:0;font-size:var(--t2);font-weight:800;letter-spacing:-.03em;flex:1}'+
  '.iib-x{width:44px;height:44px;margin:-10px -8px 0 0;border:none;background:none;font-size:22px;color:var(--t-sub);cursor:pointer;border-radius:50%}'+
  '.iib-x:hover{background:var(--t-bg)}'+
  '.iib-sub{margin:6px 0 16px;font-size:var(--t5);color:var(--t-sub);line-height:1.6}'+
  '.iib-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}'+
  '.iib-lab{font-size:var(--t6);font-weight:700;color:var(--t-sub);min-width:44px}'+
  '.iib-seg{display:inline-flex;background:var(--t-bg);border-radius:var(--t-r-sm);padding:3px}'+
  '.iib-seg button{border:none;background:none;font:inherit;font-size:var(--t5);font-weight:700;color:var(--t-sub);padding:9px 14px;min-height:44px;border-radius:10px;cursor:pointer}'+
  '.iib-seg button.on{background:var(--t-card);color:var(--t-point);box-shadow:0 1px 3px rgba(0,0,0,.08)}'+
  '.iib-in{font:inherit;font-size:var(--t5);color:var(--t-ink);border:1px solid var(--t-line);border-radius:var(--t-r-sm);padding:10px 12px;min-height:44px;background:var(--t-card);box-sizing:border-box}'+
  '.iib-in.wide{flex:1;min-width:0}'+
  '.iib-drop{display:block;margin:6px 0 10px;border:2px dashed var(--t-line);border-radius:var(--t-r);padding:22px 14px;text-align:center;cursor:pointer;color:var(--t-sub);font-size:var(--t5);line-height:1.6;transition:all .15s}'+
  '.iib-drop b{display:block;color:var(--t-ink);font-size:var(--t4)}'+
  '.iib-drop.over,.iib-drop:hover{border-color:var(--t-point);background:var(--t-point-l)}'+
  '.iib-drop input{display:none}'+
  '.iib-warn{background:var(--t-seal);color:var(--t-sealk);border-radius:var(--t-r-sm);padding:10px 12px;font-size:var(--t6);line-height:1.6;margin-bottom:16px}'+
  '.iib-up{font-size:var(--t6);padding:6px 2px;color:var(--t-sub)}'+
  '.iib-up.ok{color:var(--t-pos)}.iib-up.no{color:var(--t-neg)}'+
  '.iib-lh{display:flex;align-items:center;justify-content:space-between;margin:4px 0 6px;font-size:var(--t4);font-weight:800}'+
  '.iib-lh span{font-size:var(--t6);font-weight:600;color:var(--t-sub)}'+
  '.iib-it{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;padding:11px 0;border-top:1px solid var(--t-line)}'+
  '.iib-acts{display:flex;align-items:center;gap:4px;margin-left:auto}'+
  '.iib-chip{flex-shrink:0;font-size:var(--t6);font-weight:800;padding:4px 8px;border-radius:8px;background:var(--t-point-l);color:var(--t-point)}'+
  '.iib-chip.terms{background:var(--t-ind-l);color:var(--t-ind-d)}.iib-chip.etc{background:var(--t-bg);color:var(--t-sub)}'+
  '.iib-mid{flex:1 1 220px;min-width:0}'+
  '.iib-fn{font-size:var(--t5);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.iib-meta{font-size:var(--t6);color:var(--t-sub);margin-top:2px;line-height:1.5}'+
  '.iib-st{flex-shrink:0;font-size:var(--t6);font-weight:700;text-align:right;line-height:1.5}'+
  '.iib-st.done{color:var(--t-pos)}.iib-st.wait{color:var(--t-warn)}'+
  '.iib-btn{border:1px solid var(--t-line);background:var(--t-card);font:inherit;font-size:var(--t6);font-weight:700;color:var(--t-ink);border-radius:10px;padding:0 10px;min-height:44px;min-width:44px;cursor:pointer;margin-left:4px}'+
  '.iib-btn:hover{background:var(--t-bg)}'+
  '.iib-empty{font-size:var(--t5);color:var(--t-sub);padding:14px 0;border-top:1px solid var(--t-line)}'+
  '@media(max-width:520px){.iib-card{padding:18px 16px 14px}}';

  function iibMount(){
    var fl=document.querySelector('#insightScreen .fin-float');
    if(!fl||document.getElementById('iibOpenBtn'))return;
    var st=document.createElement('style');st.id='iibCss';st.textContent=CSS;document.head.appendChild(st);
    var b=document.createElement('button');b.id='iibOpenBtn';b.className='iib-open';b.type='button';
    b.title='자료함 — 다음 달 인사이트에 쓸 소식지·약관 PDF 넣기';
    b.innerHTML='📥<span class="t"> 자료 넣기</span>';
    b.onclick=iibOpen;fl.appendChild(b);
    var w=document.createElement('div');w.id='iibWrap';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-label','상품전략기 자료함');
    w.onclick=function(e){if(e.target===w)iibClose();};
    document.body.appendChild(w);
    document.addEventListener('keydown',function(e){if((e.key==='Escape'||e.keyCode===27)&&w.classList.contains('on')){e.stopPropagation();iibClose();}},true);
  }

  function iibOpen(){
    if(!iibSb()||!iibUid()){iibToast('로그인 후 이용하세요');return;}
    var w=document.getElementById('iibWrap');
    w.innerHTML='<div class="iib-card">'+
      '<div class="iib-hd"><h3>📥 상품전략기 자료함</h3><button class="iib-x" type="button" aria-label="닫기" onclick="iibClose()">×</button></div>'+
      '<p class="iib-sub">다음 달 상품 인사이트에 쓸 <b>소식지·약관 PDF</b>를 넣어 주세요. 어느 컴퓨터·폰에서 넣어도 됩니다. '+
        '사장님 PC가 가져가면 <b>서버 사본은 바로 지워지고</b> 목록만 남아요.</p>'+
      '<div class="iib-row"><span class="iib-lab">무엇</span><div class="iib-seg" id="iibSeg">'+
        ['news','terms','etc'].map(function(k){return '<button type="button" data-k="'+k+'" class="'+(IIB.kind===k?'on':'')+'" onclick="iibKind(\''+k+'\')">'+IIB_KIND[k]+'</button>';}).join('')+
      '</div></div>'+
      '<div class="iib-row"><span class="iib-lab">어느 달</span><input class="iib-in" id="iibMonth" type="month" value="'+iibMonthNow()+'"></div>'+
      '<div class="iib-row"><span class="iib-lab">메모</span><input class="iib-in wide" id="iibNote" maxlength="80" placeholder="어느 회사·상품인지 (예: 한화손보 시그니처 여성 건강보험4.0)"></div>'+
      '<label class="iib-drop" id="iibDrop"><b>PDF를 여기로 끌어다 놓거나 눌러서 고르세요</b>여러 개를 한 번에 넣어도 됩니다 · 한 파일 50MB까지'+
        '<input type="file" id="iibFile" accept="application/pdf,.pdf" multiple></label>'+
      '<div id="iibUps"></div>'+
      '<div class="iib-warn">⚠ <b>고객 서류·개인정보가 든 PDF는 넣지 마세요.</b> 여기는 보험사 소식지·약관 전용입니다. 소식지는 내부 교육용이라 고객에게 보여 주면 안 됩니다.</div>'+
      '<div class="iib-lh">올라온 자료 <span id="iibCnt"></span></div><div id="iibList"><div class="iib-empty">불러오는 중…</div></div>'+
    '</div>';
    w.classList.add('on');
    var inp=document.getElementById('iibFile'),drop=document.getElementById('iibDrop');
    inp.onchange=function(){iibFiles(inp.files);inp.value='';};
    drop.ondragover=function(e){e.preventDefault();drop.classList.add('over');};
    drop.ondragleave=function(){drop.classList.remove('over');};
    drop.ondrop=function(e){e.preventDefault();drop.classList.remove('over');iibFiles(e.dataTransfer.files);};
    iibLoad();
  }
  function iibClose(){var w=document.getElementById('iibWrap');if(w){w.classList.remove('on');w.innerHTML='';}}
  function iibKind(k){IIB.kind=k;var s=document.querySelectorAll('#iibSeg button');for(var i=0;i<s.length;i++)s[i].className=(s[i].getAttribute('data-k')===k?'on':'');}

  function iibLoad(){
    var sb=iibSb();if(!sb)return;
    sb.from('insight_sources').select('id,month,kind,file_name,size,note,uploaded_by,uploader_name,created_at,pulled_at,storage_path')
      .order('created_at',{ascending:false}).limit(60).then(function(r){
        if(r.error){IIB.rows=[];iibRender('목록을 못 불러왔습니다 — '+(r.error.message||''));return;}
        IIB.rows=r.data||[];iibRender();
      });
  }
  function iibRender(err){
    var el=document.getElementById('iibList');if(!el)return;
    var rows=IIB.rows||[],wait=0,me=iibUid(),adm=iibIsAdmin();
    for(var i=0;i<rows.length;i++)if(!rows[i].pulled_at)wait++;
    var c=document.getElementById('iibCnt');if(c)c.textContent=rows.length?('가져가길 기다리는 것 '+wait+'개'):'';
    if(err){el.innerHTML='<div class="iib-empty">'+iibEsc(err)+'</div>';return;}
    if(!rows.length){el.innerHTML='<div class="iib-empty">아직 올라온 자료가 없어요.</div>';return;}
    el.innerHTML=rows.map(function(r){
      var st=r.pulled_at?'<div class="iib-st done">✓ PC가 가져감<br>'+iibWhen(r.pulled_at)+'</div>':'<div class="iib-st wait">가져가길<br>기다리는 중</div>';
      var btn='';
      if(!r.pulled_at){
        btn+='<button class="iib-btn" type="button" onclick="iibView(\''+r.id+'\')" title="열어 보기">열기</button>';
        if(r.uploaded_by===me||adm)btn+='<button class="iib-btn" type="button" onclick="iibDel(\''+r.id+'\')" title="지우기" aria-label="지우기">🗑</button>';
      }
      return '<div class="iib-it"><span class="iib-chip '+r.kind+'">'+IIB_KIND[r.kind]+'</span>'+
        '<div class="iib-mid"><div class="iib-fn">'+iibEsc(r.file_name)+'</div>'+
        '<div class="iib-meta">'+iibEsc(r.month)+(r.note?' · '+iibEsc(r.note):'')+' · '+iibEsc(r.uploader_name||'')+' · '+iibWhen(r.created_at)+(r.size?' · '+iibSize(r.size):'')+'</div></div>'+
        '<div class="iib-acts">'+st+btn+'</div></div>';
    }).join('');
  }
  function iibRow(id){var rows=IIB.rows||[];for(var i=0;i<rows.length;i++)if(rows[i].id===id)return rows[i];return null;}
  function iibView(id){
    var r=iibRow(id),sb=iibSb();if(!r||!sb)return;
    var win=window.open('about:blank','_blank');
    sb.storage.from(IIB_BUCKET).createSignedUrl(r.storage_path,300).then(function(s){
      if(s.error||!s.data){if(win)win.close();iibToast('열지 못했습니다 — 이미 가져가서 지워졌을 수 있어요',5000);iibLoad();return;}
      if(win)win.location.href=s.data.signedUrl;else window.location.href=s.data.signedUrl;
    });
  }
  function iibDel(id){
    var r=iibRow(id),sb=iibSb();if(!r||!sb)return;
    if(!window.confirm('「'+r.file_name+'」을(를) 자료함에서 지울까요?'))return;
    sb.storage.from(IIB_BUCKET).remove([r.storage_path]).then(function(){
      sb.from('insight_sources').delete().eq('id',id).then(function(d){
        if(d.error){iibToast('지우지 못했습니다 — '+d.error.message,6000);return;}
        iibToast('지웠습니다');iibLoad();
      });
    });
  }

  function iibSha(file){
    return new Promise(function(res){
      try{file.arrayBuffer().then(function(buf){return crypto.subtle.digest('SHA-256',buf);}).then(function(h){
        var a=new Uint8Array(h),s='';for(var i=0;i<a.length;i++)s+=('0'+a[i].toString(16)).slice(-2);res(s);
      })['catch'](function(){res(null);});}catch(e){res(null);}
    });
  }
  function iibUpLine(name){
    var box=document.getElementById('iibUps');if(!box)return null;
    var d=document.createElement('div');d.className='iib-up';d.textContent='↑ '+name+' — 올리는 중…';box.appendChild(d);return d;
  }
  function iibUpEnd(d,ok,msg){if(!d)return;d.className='iib-up '+(ok?'ok':'no');d.textContent=(ok?'✓ ':'✗ ')+msg;}
  function iibFiles(fl){
    var list=[];for(var i=0;i<(fl?fl.length:0);i++)list.push(fl[i]);
    var pdf=list.filter(function(f){return /\.pdf$/i.test(f.name)||f.type==='application/pdf';});
    if(list.length>pdf.length)iibToast('PDF가 아닌 파일 '+(list.length-pdf.length)+'개는 뺐습니다',4000);
    var mEl=document.getElementById('iibMonth'),month=(mEl&&mEl.value)||iibMonthNow();
    if(!/^\d{4}-\d{2}$/.test(month)){iibToast('어느 달인지 골라 주세요');return;}
    var note=((document.getElementById('iibNote')||{}).value||'').trim(),kind=IIB.kind;
    var next=function(k){if(k>=pdf.length){iibLoad();return;}iibUpOne(pdf[k],month,kind,note,function(){next(k+1);});};
    next(0);
  }
  function iibUpOne(file,month,kind,note,done){
    var sb=iibSb(),me=iibUid(),line=iibUpLine(file.name);
    if(!sb||!me){iibUpEnd(line,false,file.name+' — 로그인이 풀렸습니다');done();return;}
    if(file.size>52428800){iibUpEnd(line,false,file.name+' — 50MB가 넘어요');done();return;}
    iibSha(file).then(function(sum){
      var q=sum?sb.from('insight_sources').select('file_name,uploader_name,created_at,pulled_at').eq('checksum',sum).limit(1):null;
      (q||Promise.resolve({data:[]})).then(function(dr){
        var dup=dr&&dr.data&&dr.data[0];
        if(dup){iibUpEnd(line,false,file.name+' — 이미 올라온 파일과 같아요 ('+(dup.uploader_name||'')+' · '+iibWhen(dup.created_at)+(dup.pulled_at?' · PC가 이미 가져감':'')+')');done();return;}
        var path=month+'/'+Date.now()+'_'+(sum?sum.slice(0,16):Math.random().toString(36).slice(2,10))+'.pdf';
        sb.storage.from(IIB_BUCKET).upload(path,file,{contentType:'application/pdf',upsert:false}).then(function(ur){
          if(ur.error){iibUpEnd(line,false,file.name+' — 올리지 못했습니다: '+(ur.error.message||''));done();return;}
          var nm='';try{nm=(OS.profile&&OS.profile.name)||(OS.session.user.email||'').split('@')[0];}catch(e){}
          sb.from('insight_sources').insert({month:month,kind:kind,file_name:file.name,storage_path:path,size:file.size,
            checksum:sum,note:note||null,uploaded_by:me,uploader_name:nm}).then(function(ir){
            if(ir.error){sb.storage.from(IIB_BUCKET).remove([path]);iibUpEnd(line,false,file.name+' — 목록에 적지 못했습니다: '+ir.error.message);done();return;}
            iibUpEnd(line,true,file.name+' — 넣었어요 ('+IIB_KIND[kind]+' · '+month+')');done();
          });
        });
      });
    });
  }

  window.iibOpen=iibOpen;window.iibClose=iibClose;window.iibKind=iibKind;window.iibView=iibView;window.iibDel=iibDel;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iibMount);else iibMount();
})();
