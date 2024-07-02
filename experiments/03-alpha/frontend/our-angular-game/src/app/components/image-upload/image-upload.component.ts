import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';



//Component for a player to upload images for the game
@Component({
    selector: 'app-image-upload',
    templateUrl: './image-upload.component.html',
    styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
    selectedFile: File | null = null;

    constructor(private http: HttpClient, private socketService: SocketService) { }

    onFileSelected(event: Event) {
        const inputTarget = event.target! as HTMLInputElement; //Had to do some weird fixes here because typescript kept whining. Maybe you have a better solution idk
        this.selectedFile = inputTarget!.files![0]!;
    }

    onUpload(){
        const formData = new FormData();
        formData.append('picture', this.selectedFile!); //same for here
        formData.append('promptId', '');
        formData.append('playerId', this.socketService.socket.id!); //Note: I am using ! here to cast this as a string because o/w I get a typescript 'Type 'string | undefined' is not assignable to type 'string'' error

        this.http.post('http://localhost:3000/submit', formData)
            .subscribe(response => {
                console.log(response);
            });
    }
}

