"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="content-workspace"><h1>Service interrupted</h1><p>The page couldn’t load. Try again to reconnect.</p><button onClick={reset}>Try again</button></main>}
