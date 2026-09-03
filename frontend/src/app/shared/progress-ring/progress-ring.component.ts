import { Component, Input } from '@angular/core';

@Component({selector:'app-progress-ring',standalone:true,template:`
  <div class="ring" [style.--progress]="percentage + '%'"><div><strong>{{percentage}}%</strong><span>complete</span></div></div>
`,styles:[`:host{display:block}.ring{--progress:0%;width:90px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--ink) var(--progress),#ded9ce 0);position:relative}.ring:after{content:'';position:absolute;inset:7px;border-radius:50%;background:var(--paper)}.ring div{position:relative;z-index:1;display:grid;text-align:center}.ring strong{font-size:1.1rem}.ring span{font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}`]})
export class ProgressRingComponent { @Input() percentage = 0; }
