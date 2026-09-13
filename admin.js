const SUPABASE_URL="https://gqvxoasacisbouoydpkm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable__68a0FPD6R2Ar0JPZw0waA_eiKbCNYC";
const ADMIN_UID="74d5d81f-8bbb-40f8-99fc-b16e1bfa3f5f";

if (!window.supabase) throw new Error("Supabase library failed to load.");
const client=supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=id=>document.getElementById(id);
function setMsg(id,text,type=""){const el=$(id);el.className=type;el.textContent=text||""}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
async function loadWebinars(){
  const {data,error}=await client.from("webinars").select("*").eq("status","published").order("created_at",{ascending:false});
  if(error){setMsg("formMsg",error.message,"error");return}
  $("webinarList").innerHTML=data?.length?data.map(w=>`<article class="web-item"><div class="thumb">${w.thumbnail_url?`<img src="${esc(w.thumbnail_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:11px">`:`<span>WEBINAR</span>`}</div><div><div class="status">PUBLISHED</div><h3>${esc(w.title)}</h3><p>${esc(w.category)} · ${esc(w.description)}</p></div><button class="admin-btn danger" data-delete="${esc(w.id)}">Delete</button></article>`).join(""):"<p class='muted2'>No published webinars yet.</p>";
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteWebinar(b.dataset.delete));
}
async function deleteWebinar(id){if(!confirm("Delete this webinar?"))return;const {error}=await client.from("webinars").delete().eq("id",id);if(error){alert(error.message);return}await loadWebinars()}
async function showDashboard(user){$("loginCard").classList.add("hidden");$("dashboard").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");$("userEmail").textContent=user.email||"";await loadWebinars()}
$("loginBtn").onclick=async()=>{setMsg("loginMsg","");const email=$("email").value.trim(),password=$("password").value;const {data,error}=await client.auth.signInWithPassword({email,password});if(error){setMsg("loginMsg",error.message,"error");return}if(data.user?.id!==ADMIN_UID){await client.auth.signOut();setMsg("loginMsg","This account is not the CancerZ admin.","error");return}await showDashboard(data.user)};
$("logoutBtn").onclick=async()=>{await client.auth.signOut();location.reload()};
$("clearBtn").onclick=()=>{["title","description","video","thumb"].forEach(id=>$(id).value="");setMsg("formMsg","")};
$("saveBtn").onclick=async()=>{
  setMsg("formMsg","");const title=$("title").value.trim(),description=$("description").value.trim(),video=$("video").files[0],thumb=$("thumb").files[0];
  if(!title||!video){setMsg("formMsg","Enter a title and choose a video.","error");return}
  if(video.size>50*1024*1024){setMsg("formMsg","This video is over 50 MB. Your current Supabase project shows a 50 MB upload limit.","error");return}
  const {data:{user}}=await client.auth.getUser();if(!user||user.id!==ADMIN_UID){setMsg("formMsg","Admin session required.","error");return}
  const id=crypto.randomUUID(),safeName=video.name.replace(/[^a-zA-Z0-9._-]/g,"_");const videoPath=user.id+"/"+id+"-"+safeName;
  $("saveBtn").disabled=true;$("progressWrap").hidden=false;$("progressBar").style.width="10%";
  let {error}=await client.storage.from("webinars").upload(videoPath,video,{upsert:false,cacheControl:"3600"});
  if(error){$("saveBtn").disabled=false;$("progressWrap").hidden=true;setMsg("formMsg",error.message,"error");return}
  $("progressBar").style.width="65%";
  let thumbUrl=null,thumbPath=null;
  if(thumb){thumbPath=user.id+"/"+id+"-thumb-"+thumb.name.replace(/[^a-zA-Z0-9._-]/g,"_");const t=await client.storage.from("webinars").upload(thumbPath,thumb,{upsert:false,cacheControl:"3600"});if(t.error){await client.storage.from("webinars").remove([videoPath]);$("saveBtn").disabled=false;$("progressWrap").hidden=true;setMsg("formMsg",t.error.message,"error");return}thumbUrl=client.storage.from("webinars").getPublicUrl(thumbPath).data.publicUrl}
  const videoUrl=client.storage.from("webinars").getPublicUrl(videoPath).data.publicUrl;$("progressBar").style.width="85%";
  const ins=await client.from("webinars").insert({title,category:$("category").value,description,video_url:videoUrl,thumbnail_url:thumbUrl,status:"published"});
  if(ins.error){await client.storage.from("webinars").remove(thumbPath?[videoPath,thumbPath]:[videoPath]);$("saveBtn").disabled=false;$("progressWrap").hidden=true;setMsg("formMsg",ins.error.message,"error");return}
  $("progressBar").style.width="100%";$("saveBtn").disabled=false;setMsg("formMsg","Webinar uploaded and published successfully.","success");["title","description","video","thumb"].forEach(id=>$(id).value="");await loadWebinars();setTimeout(()=>{$("progressWrap").hidden=true;$("progressBar").style.width="0"},800)
};
(async()=>{const {data}=await client.auth.getSession();if(data.session?.user?.id===ADMIN_UID)await showDashboard(data.session.user)})();
