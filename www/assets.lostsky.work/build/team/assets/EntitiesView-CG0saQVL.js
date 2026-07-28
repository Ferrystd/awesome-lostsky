import{f as w,X as u,a0 as N,d as _,ai as $,H as T,i as h,k as S,j as m,u as p,x as C,t as y,F as j,v as R,q as E,h as f,p as O,l as P,aq as L,z as q,_ as H}from"./index--6Kpy4Zw.js";import{u as I}from"./useQuery-Bq-BOFy0.js";import{A as D}from"./AdminPageHeader-BmYQg7UD.js";import{w as M,v as W,c as F}from"./Loading-Bt4hDgED.js";import{f as K}from"./Suffix-YEYgC8ub.js";import{d as A,c as k,a as v,e as x,h as V,u as X,z as Q,j as U}from"./light-Ccjcu9At.js";import{u as Y,N as G}from"./Select-YsUKsiX_.js";import"./queryObserver-CsoSMuo4.js";import"./useQueryClient-CZPj7Eb1.js";import"./arrow-left-DRGBLVnh.js";import"./fade-in-scale-up.cssr-BWBgjQ9O.js";import"./use-false-until-truthy-NCm2iyUg.js";import"./index-BJKaMiZy.js";import"./Tag-DPVCTFKc.js";import"./color-to-class-B0iQgAn2.js";import"./format-length-CLmkq7LL.js";import"./happens-in-CM8LO42l.js";function J(i){const{opacityDisabled:a,heightTiny:e,heightSmall:t,heightMedium:d,heightLarge:r,heightHuge:n,primaryColor:l,fontSize:s}=i;return{fontSize:s,textColor:l,sizeTiny:e,sizeSmall:t,sizeMedium:d,sizeLarge:r,sizeHuge:n,color:l,opacitySpinning:a}}const Z={common:A,self:J},ee=k([k("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),v("spin-container",`
 position: relative;
 `,[v("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[K()])]),v("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),v("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[x("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),v("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),v("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[x("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),te={small:20,medium:18,large:16},se=Object.assign(Object.assign(Object.assign({},V.props),{contentClass:String,contentStyle:[Object,String],description:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),M),ie=w({name:"Spin",props:se,slots:Object,setup(i){const{mergedClsPrefixRef:a,inlineThemeDisabled:e}=X(i),t=V("Spin","-spin",ee,Z,i,a),d=_(()=>{const{size:s}=i,{common:{cubicBezierEaseInOut:c},self:o}=t.value,{opacitySpinning:g,color:b,textColor:z}=o,B=typeof s=="number"?Q(s):o[U("size",s)];return{"--n-bezier":c,"--n-opacity-spinning":g,"--n-size":B,"--n-color":b,"--n-text-color":z}}),r=e?F("spin",_(()=>{const{size:s}=i;return typeof s=="number"?String(s):s[0]}),d,i):void 0,n=Y(i,["spinning","show"]),l=T(!1);return $(s=>{let c;if(n.value){const{delay:o}=i;if(o){c=window.setTimeout(()=>{l.value=!0},o),s(()=>{clearTimeout(c)});return}}l.value=n.value}),{mergedClsPrefix:a,active:l,mergedStrokeWidth:_(()=>{const{strokeWidth:s}=i;if(s!==void 0)return s;const{size:c}=i;return te[typeof c=="number"?"medium":c]}),cssVars:e?void 0:d,themeClass:r==null?void 0:r.themeClass,onRender:r==null?void 0:r.onRender}},render(){var i,a;const{$slots:e,mergedClsPrefix:t,description:d}=this,r=e.icon&&this.rotate,n=(d||e.description)&&u("div",{class:`${t}-spin-description`},d||((i=e.description)===null||i===void 0?void 0:i.call(e))),l=e.icon?u("div",{class:[`${t}-spin-body`,this.themeClass]},u("div",{class:[`${t}-spin`,r&&`${t}-spin--rotate`],style:e.default?"":this.cssVars},e.icon()),n):u("div",{class:[`${t}-spin-body`,this.themeClass]},u(W,{clsPrefix:t,style:e.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,radius:this.radius,scale:this.scale,class:`${t}-spin`}),n);return(a=this.onRender)===null||a===void 0||a.call(this),e.default?u("div",{class:[`${t}-spin-container`,this.themeClass],style:this.cssVars},u("div",{class:[`${t}-spin-content`,this.active&&`${t}-spin-content--spinning`,this.contentClass],style:this.contentStyle},e),u(N,{name:"fade-in-transition"},{default:()=>this.active?l:null})):l}}),ne={class:"entities-view"},oe={class:"filter"},ae={key:1,class:"feedback",role:"alert"},re={key:2,class:"entity-list"},le={class:"avatar"},ce={key:0,class:"empty"},de=w({__name:"EntitiesView",setup(i){const a=T(null),e=I({queryKey:_(()=>["entities",a.value]),queryFn:()=>q.get("/entity/index",{type:a.value||void 0,limit:100})}),t={team:"团队",teamMember:"成员",teamCustomer:"客户",teamVirtual:"虚拟实体"},d=[{label:"全部实体",value:""},...Object.entries(t).map(([r,n])=>({label:n,value:r}))];return(r,n)=>{var l,s,c;return f(),h("div",ne,[S(D,{title:"实体",description:"按类型查看并管理团队、成员、客户与虚拟实体的公开资料。"}),m("label",oe,[n[1]||(n[1]=m("span",null,"实体类型",-1)),S(p(G),{value:a.value,"onUpdate:value":n[0]||(n[0]=o=>a.value=o),options:d,clearable:""},null,8,["value"])]),p(e).isPending.value?(f(),C(p(ie),{key:0,size:"large"})):p(e).isError.value?(f(),h("p",ae,y(p(O)(p(e).error.value)),1)):(f(),h("div",re,[(f(!0),h(j,null,R(((l=p(e).data.value)==null?void 0:l.list)??[],o=>(f(),C(p(L),{key:o.id,to:{path:"/entity",query:{id:o.id}},class:"entity-row"},{default:P(()=>{var g,b,z;return[m("span",le,y(((b=(g=o.profile)==null?void 0:g.name)==null?void 0:b.slice(0,1))||"—"),1),m("span",null,[m("strong",null,y(((z=o.profile)==null?void 0:z.name)||"未命名实体"),1),m("small",null,y(t[o.entityable_type])+" · @"+y(o.slug),1)]),n[2]||(n[2]=m("span",null,"管理",-1))]}),_:2},1032,["to"]))),128)),(c=(s=p(e).data.value)==null?void 0:s.list)!=null&&c.length?E("",!0):(f(),h("p",ce,"当前筛选下没有实体。"))]))])}}}),Ve=H(de,[["__scopeId","data-v-40422e86"]]);export{Ve as default};
