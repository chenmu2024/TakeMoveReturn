function showToast(message){const toast=document.querySelector('.toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove('show'),3800)}

const FieldmarkDemo=(()=>{
  const key='fieldmark-demo-v2';
  const defaults={tools:[
    {id:'m18-drill',name:'Milwaukee M18 Drill',label:'FM-1842',place:'Jordan Hill · Oak Street Remodel',status:'Checked out',tone:'',updated:'8 min ago'},
    {id:'table-saw',name:'DeWalt Table Saw',label:'FM-0311',place:'Oak Street Remodel',status:'On site',tone:'',updated:'21 min ago'},
    {id:'multimeter',name:'Fluke Multimeter',label:'FM-0190',place:'Main Shop',status:'Available',tone:'gray',updated:'1 hr ago'}
  ],activity:[
    {text:'Milwaukee M18 Drill checked out to Jordan Hill',place:'Oak Street Remodel',time:'8 min ago'},
    {text:'DeWalt Table Saw moved to Oak Street Remodel',place:'Oak Street Remodel',time:'21 min ago'},
    {text:'Fluke Multimeter returned to Main Shop',place:'Main Shop',time:'1 hr ago'}
  ]};
  const escape=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const get=()=>{try{return JSON.parse(localStorage.getItem(key))||structuredClone(defaults)}catch{return structuredClone(defaults)}};
  const save=data=>localStorage.setItem(key,JSON.stringify(data));
  function appendActivity(data,text,place){data.activity.unshift({text,place,time:'Just now'});data.activity=data.activity.slice(0,12)}
  function renderTools(filter=''){
    const body=document.getElementById('toolRows');if(!body)return;
    const needle=filter.trim().toLowerCase();const data=get();
    const tools=data.tools.filter(tool=>[tool.name,tool.label,tool.place,tool.status].join(' ').toLowerCase().includes(needle));
    body.innerHTML=tools.length?tools.map(tool=>`<tr><td><b>${escape(tool.name)}</b><br><small>${escape(tool.label)}</small></td><td>${escape(tool.place)}</td><td><span class="badge ${tool.tone}">${escape(tool.status)}</span></td><td>${escape(tool.updated)}</td><td>${tool.id==='m18-drill'?'<a class="app-action" href="/app/tools/m18-drill/">Open</a>':'<button class="app-action" type="button">Open</button>'}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No tools match that search.</td></tr>'
  }
  function renderDashboard(){
    const body=document.getElementById('activityRows');if(!body)return;const data=get();
    body.innerHTML=data.activity.slice(0,4).map(item=>`<tr><td><b>${escape(item.text)}</b></td><td><span class="badge gray">${escape(item.place)}</span></td><td>${escape(item.time)}</td><td><a class="app-action" href="/app/activity/">View</a></td></tr>`).join('');
  }
  function openToolForm(){
    const dialog=document.createElement('dialog');dialog.className='tool-dialog';dialog.innerHTML='<form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><p class="eyebrow">NEW TOOL</p><h2>Add a tool</h2><p>Start with the name and a label ID. You can add details later.</p><label>Tool name<input name="name" required maxlength="80" placeholder="e.g. Bosch Rotary Hammer"></label><label>Label ID<input name="label" required maxlength="40" placeholder="e.g. FM-1843"></label><label>Starting location<select name="place"><option>Main Shop</option><option>Oak Street Remodel</option><option>Van 2</option></select></label><button class="button" value="default">Add tool <span>→</span></button></form>';
    document.body.append(dialog);dialog.showModal();dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const form=new FormData(event.currentTarget);const name=form.get('name').trim(),label=form.get('label').trim(),place=form.get('place');if(!name||!label)return;const data=get();data.tools.unshift({id:'custom-'+Date.now(),name,label,place,status:'Available',tone:'gray',updated:'Just now'});appendActivity(data,`${name} added to the workspace`,place);save(data);dialog.close();dialog.remove();renderTools();renderDashboard();showToast(`${name} is ready for a QR label.`)},{once:true});
  }
  function changeM18(action){const data=get();const tool=data.tools.find(item=>item.id==='m18-drill');if(!tool)return;const update={take:{place:'Jordan Hill · Oak Street Remodel',status:'Checked out',tone:'',text:'Milwaukee M18 Drill checked out to Jordan Hill'},move:{place:'Van 2',status:'In transfer',tone:'warn',text:'Milwaukee M18 Drill moved to Van 2'},return:{place:'Main Shop',status:'Available',tone:'gray',text:'Milwaukee M18 Drill returned to Main Shop'}}[action];Object.assign(tool,update,{updated:'Just now'});appendActivity(data,update.text,update.place);save(data);renderTools();renderDashboard();renderDetail();showToast(update.text+'.')}
  function renderDetail(){const root=document.getElementById('toolDetail');if(!root)return;const tool=get().tools.find(item=>item.id==='m18-drill');if(!tool)return;root.innerHTML=`<div class="detail-heading"><div><p class="eyebrow">${escape(tool.label)}</p><h1>${escape(tool.name)}</h1><p>${escape(tool.place)}</p></div><span class="badge ${tool.tone}">${escape(tool.status)}</span></div><div class="detail-grid"><section class="app-card detail-card"><h2>Next action</h2><p>Record the handoff that is happening now.</p><div class="detail-actions"><button class="button" onclick="FieldmarkDemo.changeM18('take')">Take tool</button><button class="button outline" onclick="FieldmarkDemo.changeM18('move')">Move tool</button><button class="button outline" onclick="FieldmarkDemo.changeM18('return')">Return to shop</button></div></section><section class="app-card detail-card"><h2>Tool details</h2><dl><div><dt>Label ID</dt><dd>${escape(tool.label)}</dd></div><div><dt>Current record</dt><dd>${escape(tool.place)}</dd></div><div><dt>Condition</dt><dd>Ready to use</dd></div></dl></section></div><section class="app-card detail-card history"><h2>Activity history</h2>${get().activity.filter(item=>item.text.includes('Milwaukee')).map(item=>`<div><b>${escape(item.text)}</b><span>${escape(item.time)}</span></div>`).join('')||'<p>No activity yet.</p>'}</section>`}
  return{renderTools,renderDashboard,openToolForm,changeM18,renderDetail,get};
})();

document.addEventListener('DOMContentLoaded',()=>{FieldmarkDemo.renderTools();FieldmarkDemo.renderDashboard();FieldmarkDemo.renderDetail();const search=document.querySelector('[data-tool-search]');if(search)search.addEventListener('input',event=>FieldmarkDemo.renderTools(event.target.value))});
