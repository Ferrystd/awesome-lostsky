import{af as E,ax as w,ay as g,bn as R,az as x,d as T,O as f,bo as P,E as B,aF as O,aH as V,aJ as j,aQ as M,k as z,G as C,bp as N,bq as I,br as q,aS as H,I as W,C as A,u as D,a as k,f as b,w as L,e as y,h as $,t as F,y as K,F as U,j as Q,bs as Y,M as G,o as h,Y as J,n as X,c as Z,_ as ee}from"./index-D3ZDatKd.js";import{L as te}from"./LsEmptyState-gSGeHs99.js";import{L as se}from"./LsEntityIdentity-zuYhtU6L.js";import{L as ie}from"./LsListToolbar-Co4hj10j.js";import{L as ne}from"./LsResponsiveActions-URhsYBiQ.js";import{_ as ae}from"./AdminPageHeader.vue_vue_type_script_setup_true_lang-B6amMtad.js";import{P as oe}from"./pencil-DvF1CHlz.js";import{N as re}from"./Select-0zISuMO2.js";import"./Empty-Bbbtyi7Z.js";import"./Input-j_Qd3Kv9.js";import"./entity-Bl2a0v5h.js";import"./search-n6xcSm69.js";import"./arrow-left-DHEVM7Q1.js";import"./Tag-DPznU16X.js";function le(t){const{opacityDisabled:o,heightTiny:e,heightSmall:s,heightMedium:p,heightLarge:r,heightHuge:l,primaryColor:c,fontSize:i}=t;return{fontSize:i,textColor:c,sizeTiny:e,sizeSmall:s,sizeMedium:p,sizeLarge:r,sizeHuge:l,color:c,opacitySpinning:o}}const ce={common:E,self:le},ue=w([w("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),g("spin-container",`
 position: relative;
 `,[g("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[R()])]),g("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),g("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[x("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),g("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),g("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[x("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),de={small:20,medium:18,large:16},pe=Object.assign(Object.assign(Object.assign({},V.props),{contentClass:String,contentStyle:[Object,String],description:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),I),me=T({name:"Spin",props:pe,slots:Object,setup(t){const{mergedClsPrefixRef:o,inlineThemeDisabled:e}=O(t),s=V("Spin","-spin",ue,ce,t,o),p=z(()=>{const{size:i}=t,{common:{cubicBezierEaseInOut:u},self:v}=s.value,{opacitySpinning:_,color:d,textColor:a}=v,n=typeof i=="number"?q(i):v[H("size",i)];return{"--n-bezier":u,"--n-opacity-spinning":_,"--n-size":n,"--n-color":d,"--n-text-color":a}}),r=e?j("spin",z(()=>{const{size:i}=t;return typeof i=="number"?String(i):i[0]}),p,t):void 0,l=N(t,["spinning","show"]),c=C(!1);return M(i=>{let u;if(l.value){const{delay:v}=t;if(v){u=window.setTimeout(()=>{c.value=!0},v),i(()=>{clearTimeout(u)});return}}c.value=l.value}),{mergedClsPrefix:o,active:c,mergedStrokeWidth:z(()=>{const{strokeWidth:i}=t;if(i!==void 0)return i;const{size:u}=t;return de[typeof u=="number"?"medium":u]}),cssVars:e?void 0:p,themeClass:r==null?void 0:r.themeClass,onRender:r==null?void 0:r.onRender}},render(){var t,o;const{$slots:e,mergedClsPrefix:s,description:p}=this,r=e.icon&&this.rotate,l=(p||e.description)&&f("div",{class:`${s}-spin-description`},p||((t=e.description)===null||t===void 0?void 0:t.call(e))),c=e.icon?f("div",{class:[`${s}-spin-body`,this.themeClass]},f("div",{class:[`${s}-spin`,r&&`${s}-spin--rotate`],style:e.default?"":this.cssVars},e.icon()),l):f("div",{class:[`${s}-spin-body`,this.themeClass]},f(P,{clsPrefix:s,style:e.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,radius:this.radius,scale:this.scale,class:`${s}-spin`}),l);return(o=this.onRender)===null||o===void 0||o.call(this),e.default?f("div",{class:[`${s}-spin-container`,this.themeClass],style:this.cssVars},f("div",{class:[`${s}-spin-content`,this.active&&`${s}-spin-content--spinning`,this.contentClass],style:this.contentStyle},e),f(B,{name:"fade-in-transition"},{default:()=>this.active?c:null})):c}}),fe={class:"entities-view"},ve={key:1,class:"feedback",role:"alert"},ye={key:3,class:"entity-list"},he=T({__name:"EntitiesView",setup(t){const o=C(null),e=C(""),s=W(),p=A(),r=z(()=>J(s.data.value,"team.entity.profile.manage")),l=D({queryKey:z(()=>["entities",o.value]),queryFn:()=>X.get("/entity/index",{type:o.value||void 0,limit:100})}),c={team:"团队",teamMember:"成员",teamCustomer:"客户",teamVirtual:"虚拟实体"},i=[{label:"全部实体",value:""},...Object.entries(c).map(([d,a])=>({label:a,value:d}))],u=z(()=>{var n;const d=e.value.trim().toLocaleLowerCase(),a=((n=l.data.value)==null?void 0:n.list)??[];return d?a.filter(m=>{var S;return`${((S=m.profile)==null?void 0:S.name)??""} ${m.slug} ${c[m.entityable_type]??""}`.toLocaleLowerCase().includes(d)}):a});function v(d){return[{key:"chat",label:"对话",icon:G},{key:"manage",label:r.value?"管理":"查看",icon:oe}]}function _(d,a){d==="chat"?window.location.href=Z("/new",{participant:a.slug}):p.push({path:"/entity",query:{id:a.id}})}return(d,a)=>(h(),k("div",fe,[b(ae,{title:"实体",description:"浏览团队、成员、客户与虚拟实体。具有全量读取权限时也会列出团队内隐藏实体。"}),b(ie,{modelValue:e.value,"onUpdate:modelValue":a[1]||(a[1]=n=>e.value=n),placeholder:"搜索实体名称或 slug","aria-label":"搜索实体","count-label":`${u.value.length} 个实体`},{filters:L(()=>[b(y(re),{value:o.value,"onUpdate:value":a[0]||(a[0]=n=>o.value=n),options:i,clearable:"",placeholder:"全部类型"},null,8,["value"])]),_:1},8,["modelValue","count-label"]),y(l).isPending.value?(h(),$(y(me),{key:0,size:"large"})):y(l).isError.value?(h(),k("p",ve,F(y(K)(y(l).error.value)),1)):u.value.length?(h(),k("div",ye,[(h(!0),k(U,null,Q(u.value,n=>(h(),k("article",{key:n.id,class:"entity-row"},[b(y(Y),{to:{path:"/entity",query:{id:n.id}},class:"entity-main"},{default:L(()=>{var m,S;return[b(se,{type:n.entityable_type,name:((m=n.profile)==null?void 0:m.name)||"未命名实体",slug:n.slug,"image-url":(S=n.profile)==null?void 0:S.avatar},null,8,["type","name","slug","image-url"])]}),_:2},1032,["to"]),b(ne,{actions:v(),"primary-key":"manage",onSelect:m=>_(m,n)},null,8,["actions","onSelect"])]))),128))])):(h(),$(te,{key:2,title:"没有可查看的实体",description:"调整搜索词或实体类型筛选后查看。"}))]))}}),Re=ee(he,[["__scopeId","data-v-1fc7783b"]]);export{Re as default};
