export const isDiamondRoute=(id:string)=>["FX","6X","7X"].includes(id);
export const routeSymbol=(id:string)=>({FX:"F","6X":"6","7X":"7",H:"S",GS:"S",FS:"S"}[id]??id);
export const routeLabel=(id:string)=>isDiamondRoute(id)?`◇ ${routeSymbol(id)} Express`:routeSymbol(id);
export const routeList=(ids:string[])=>ids.map(routeLabel).join(" · ");
export const routeColor=(id:string)=>({"1":"#ee352e","2":"#ee352e","3":"#ee352e","4":"#00933c","5":"#00933c","6":"#00933c","6X":"#00933c","7":"#b933ad","7X":"#b933ad",A:"#0039a6",C:"#0039a6",E:"#0039a6",B:"#ff6319",D:"#ff6319",F:"#ff6319",FX:"#ff6319",M:"#ff6319",G:"#6cbe45",J:"#996633",Z:"#996633",L:"#a7a9ac",N:"#fccc0a",Q:"#fccc0a",R:"#fccc0a",W:"#fccc0a",GS:"#808183",FS:"#808183",H:"#808183"}[id]??"#0039a6");
export const routeTextColor=(id:string)=>["N","Q","R","W"].includes(id)?"#111":"#fff";
export function createRouteBullet(id:string){const ns="http://www.w3.org/2000/svg";const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 40 40");svg.setAttribute("class","route-bullet");svg.setAttribute("role","img");svg.setAttribute("aria-label",routeLabel(id));const shape=document.createElementNS(ns,isDiamondRoute(id)?"polygon":"circle");if(isDiamondRoute(id))shape.setAttribute("points","20,1 39,20 20,39 1,20");else{shape.setAttribute("cx","20");shape.setAttribute("cy","20");shape.setAttribute("r","19");}shape.setAttribute("fill",routeColor(id));const text=document.createElementNS(ns,"text");text.setAttribute("x","20");text.setAttribute("y","27");text.setAttribute("text-anchor","middle");text.setAttribute("fill",routeTextColor(id));text.setAttribute("font-size","23");text.setAttribute("font-family","Arial, sans-serif");text.setAttribute("font-weight","700");text.textContent=routeSymbol(id);svg.append(shape,text);return svg;}

export const formatRouteText=(text:string)=>text.replace(/\[(FX|6X|7X|H|GS|FS)\]/g,(_,id:string)=>`[${routeLabel(id)}]`);
export function serviceRouteName(id:string,name:string,mode:"day"|"night"){
 if(mode==="day")return name;
 return ({A:"8 Avenue Local · includes Lefferts Blvd shuttle", "2":"7 Avenue Local", "4":"Lexington Avenue Local", "5":"Dyre Av–E 180 St Shuttle", F:"Queens Blvd / 6 Avenue Local", M:"Middle Village–Myrtle Av Shuttle", N:"Broadway Local · via Lower Manhattan", Q:"Broadway / Brighton Local", R:"Whitehall St–Bay Ridge Local"} as Record<string,string>)[id]??name;
}
