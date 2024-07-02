import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

import{ AppComponent } from './app.component';
import { PromptComponent } from './components/prompt/prompt.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';
import { SocketService } from './services/socket.service';

@NgModule({
    declarations:[
        AppComponent,
        PromptComponent,
        ImageUploadComponent,
        ScoreboardComponent
    ],
    imports: [
        BrowserModule,
        FormsModule
    ],
    providers: [SocketService, provideHttpClient()],
    bootstrap: [AppComponent],
})
export class AppModule { }
