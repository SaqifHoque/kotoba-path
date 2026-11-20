import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonalMemoryService } from './personal-memory.service';

let nextEditor = 0;
@Component({selector:'app-personal-memory-editor',standalone:true,imports:[CommonModule,FormsModule],
  templateUrl:'./personal-memory-editor.component.html',styleUrls:['./personal-memory-editor.component.scss']})
export class PersonalMemoryEditorComponent {
  @Input() subjectId = '';
  readonly id = 'personal-memory-' + ++nextEditor;
  constructor(public readonly memory: PersonalMemoryService) {}
}
