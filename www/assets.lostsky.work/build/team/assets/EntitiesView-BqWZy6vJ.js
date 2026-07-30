import{av as M,az as T,aw as g,bg as O,ax as N,d as j,P as f,bh as L,D,aC as I,aD as E,aF as q,am as H,k as _,E as R,bi as W,b1 as F,aZ as A,I as K,u as U,a as h,f as b,b as p,e as c,h as Q,t as y,y as X,F as Y,j as Z,i as V,w as $,g as B,o as v,bj as P,c as G,M as J,a7 as ee,n as te,_ as se}from"./index-49TE631d.js";import{A as ie}from"./AdminPageHeader-3qpysEvX.js";import{u as ae,N as ne}from"./Select-CO8TJCeg.js";import"./arrow-left-9kWhiLjI.js";import"./Suffix-B5z1o2Iu.js";import"./Tag-BdUeqpHF.js";import"./use-locale-C3i-A2IO.js";import"./get-CPYLe2Jo.js";import"./happens-in-CM8LO42l.js";function oe(i){const{opacityDisabled:n,heightTiny:s,heightSmall:a,heightMedium:o,heightLarge:r,heightHuge:u,primaryColor:l,fontSize:e}=i;return{fontSize:e,textColor:l,sizeTiny:s,sizeSmall:a,sizeMedium:o,sizeLarge:r,sizeHuge:u,color:l,opacitySpinning:n}}const re={common:M,self:oe},le=T([T("@keyframes spin-rotate",`
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
 `,[O()])]),g("spin-body",`
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
 `,[N("rotate",`
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
 `,[N("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),ce={small:20,medium:18,large:16},de=Object.assign(Object.assign(Object.assign({},E.props),{contentClass:String,contentStyle:[Object,String],description:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),W),ue=j({name:"Spin",props:de,slots:Object,setup(i){const{mergedClsPrefixRef:n,inlineThemeDisabled:s}=I(i),a=E("Spin","-spin",le,re,i,n),o=_(()=>{const{size:e}=i,{common:{cubicBezierEaseInOut:d},self:m}=a.value,{opacitySpinning:z,color:t,textColor:C}=m,k=typeof e=="number"?F(e):m[A("size",e)];return{"--n-bezier":d,"--n-opacity-spinning":z,"--n-size":k,"--n-color":t,"--n-text-color":C}}),r=s?q("spin",_(()=>{const{size:e}=i;return typeof e=="number"?String(e):e[0]}),o,i):void 0,u=ae(i,["spinning","show"]),l=R(!1);return H(e=>{let d;if(u.value){const{delay:m}=i;if(m){d=window.setTimeout(()=>{l.value=!0},m),e(()=>{clearTimeout(d)});return}}l.value=u.value}),{mergedClsPrefix:n,active:l,mergedStrokeWidth:_(()=>{const{strokeWidth:e}=i;if(e!==void 0)return e;const{size:d}=i;return ce[typeof d=="number"?"medium":d]}),cssVars:s?void 0:o,themeClass:r==null?void 0:r.themeClass,onRender:r==null?void 0:r.onRender}},render(){var i,n;const{$slots:s,mergedClsPrefix:a,description:o}=this,r=s.icon&&this.rotate,u=(o||s.description)&&f("div",{class:`${a}-spin-description`},o||((i=s.description)===null||i===void 0?void 0:i.call(s))),l=s.icon?f("div",{class:[`${a}-spin-body`,this.themeClass]},f("div",{class:[`${a}-spin`,r&&`${a}-spin--rotate`],style:s.default?"":this.cssVars},s.icon()),u):f("div",{class:[`${a}-spin-body`,this.themeClass]},f(L,{clsPrefix:a,style:s.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,radius:this.radius,scale:this.scale,class:`${a}-spin`}),u);return(n=this.onRender)===null||n===void 0||n.call(this),s.default?f("div",{class:[`${a}-spin-container`,this.themeClass],style:this.cssVars},f("div",{class:[`${a}-spin-content`,this.active&&`${a}-spin-content--spinning`,this.contentClass],style:this.contentStyle},s),f(D,{name:"fade-in-transition"},{default:()=>this.active?l:null})):l}}),pe={class:"entities-view"},me={class:"filter"},fe={key:1,class:"feedback",role:"alert"},ve={key:2,class:"entity-list"},he={class:"avatar"},ge={key:0},ye=["aria-label"],be=["href","aria-label"],_e={key:0,class:"empty"},ze=j({__name:"EntitiesView",setup(i){const n=R(null),s=K(),a=_(()=>ee(s.data.value,"team.entity.profile.manage")),o=U({queryKey:_(()=>["entities",n.value]),queryFn:()=>te.get("/entity/index",{type:n.value||void 0,limit:100})}),r={team:"团队",teamMember:"成员",teamCustomer:"客户",teamVirtual:"虚拟实体"},u=[{label:"全部实体",value:""},...Object.entries(r).map(([l,e])=>({label:e,value:l}))];return(l,e)=>{var d,m,z;return v(),h("div",pe,[b(ie,{title:"实体",description:"浏览团队、成员、客户与虚拟实体。具有全量读取权限时也会列出团队内隐藏实体。"}),p("label",me,[e[1]||(e[1]=p("span",null,"实体类型",-1)),b(c(ne),{value:n.value,"onUpdate:value":e[0]||(e[0]=t=>n.value=t),options:u,clearable:""},null,8,["value"])]),c(o).isPending.value?(v(),Q(c(ue),{key:0,size:"large"})):c(o).isError.value?(v(),h("p",fe,y(c(X)(c(o).error.value)),1)):(v(),h("div",ve,[(v(!0),h(Y,null,Z(((d=c(o).data.value)==null?void 0:d.list)??[],t=>{var C,k;return v(),h("article",{key:t.id,class:"entity-row"},[b(c(P),{to:{path:"/entity",query:{id:t.id}},class:"entity-main"},{default:$(()=>{var S,x,w;return[p("span",he,y(((x=(S=t.profile)==null?void 0:S.name)==null?void 0:x.slice(0,1))||"—"),1),p("span",null,[p("strong",null,y(((w=t.profile)==null?void 0:w.name)||"未命名实体"),1),p("small",null,[B(y(r[t.entityable_type])+" · @"+y(t.slug)+" ",1),t.entityable_type!=="team"&&Number(t.is_internal_visible)!==1?(v(),h("em",ge,"团队内隐藏")):V("",!0)])])]}),_:2},1032,["to"]),p("nav",{"aria-label":`${((C=t.profile)==null?void 0:C.name)||t.slug} 操作`},[p("a",{href:c(G)("/new",{participant:t.slug}),"aria-label":`与 ${((k=t.profile)==null?void 0:k.name)||t.slug} 对话`},[b(c(J),{size:17}),e[2]||(e[2]=p("span",null,"对话",-1))],8,be),b(c(P),{to:{path:"/entity",query:{id:t.id}}},{default:$(()=>[B(y(a.value?"管理":"查看"),1)]),_:1},8,["to"])],8,ye)])}),128)),(z=(m=c(o).data.value)==null?void 0:m.list)!=null&&z.length?V("",!0):(v(),h("p",_e,"当前筛选下没有可查看的实体。"))]))])}}}),Be=se(ze,[["__scopeId","data-v-f8d8382b"]]);export{Be as default};
