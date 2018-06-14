import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, Toast } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HomePage } from '../pages/home/home';
import { AnnotatePage } from '../pages/annotate/annotate';
import { DocumentService } from '../services/document.service';
import { PopoverController, ToastController} from 'ionic-angular';
import { ViewController } from 'ionic-angular';
import { OptionsPopoverPage } from './options.popover.page';
import { MenuController } from 'ionic-angular';
import { BlockStackService } from './../services/blockstack.service';
import moment from 'moment-timezone';
import 'rxjs/add/operator/toPromise';
import { LoadingController } from 'ionic-angular';
import { prototype } from 'long';
declare let blockstack: any;
declare let document: any;
declare var window: any;
const $ = document.querySelectorAll.bind(document);
import { AlertController } from 'ionic-angular';
declare let jQuery: any;



@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{ title: string, component: any }>;

  name: string;
  isLoggedIn = false;
  loginState = "Login";
  fileName = "blockusign/pdf1.pdf";
  profile: any;
  pdfBuffer: any;
  avatar: string = "http://www.gravatar.com/avatar/?d=identicon";
  documentsList: any;
  email: string;

  constructor(
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    public documentService: DocumentService,
    public popoverCtrl: PopoverController,
    public menuCtrl: MenuController,
    public blockStackService: BlockStackService,
    public toastCntrl: ToastController
  ) {

    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: '1). Upload PDF', component: HomePage },
      { title: '2). Annotate PDF', component: AnnotatePage }
    ];

    // global vars
    if (window.location.host.includes("localhost")) {
      window.apiUrl = "http://localhost:5000";
    }
    else {
      window.apiUrl = "";
    }


  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.


      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.showProfile();
      this.setupDiscordMenu();


    });
  }

  // openPage(page) {
  //   // Reset the content nav to have just this page
  //   // we wouldn't want the back button to show in this scenario
  //   this.nav.setRoot(page.component);
  // }

  login() {
    const origin = window.location.origin
    blockstack.redirectToSignIn(origin, origin + '/manifest.json', ['store_write', 'publish_data', 'email'])
  }

  next() {


    this.menuCtrl.close();

    // if (this.nav.getActive().name == "AnnotatePage") {
    //  this.nav.pop();
    // }
    // else{
    //   jQuery('.block-pdf-page').empty();
    // }

    this.nav.setRoot("HomePage");

    let guid = this.documentService.currentDoc.guid;
    this.nav.push("AnnotatePage", {
      guid: guid
    });

  }

  home() {
    this.menuCtrl.close();
    this.nav.setRoot("HomePage");
    this.clearActive();
  }

  logout() {
    blockstack.signUserOut(window.location.origin);
  }

  async showProfile() {

    if (blockstack.isUserSignedIn()) {

      let profile = blockstack.loadUserData();
      this.name = profile.username;
      this.isLoggedIn = true;
      try {
        this.avatar = profile.profile.image[0].contentUrl;
      } catch (e) { console.log('no profile pic') }

      this.loginState = "[Logout]";
      this.documentService.getDocumentsIndex(true).then((data) => {
        this.documentsList = this.documentService.documentsListFiltered; //data;
      });

      //if (!profile.username) {

        let profileData = await this.blockStackService.getProfileData();

        if (!profileData) {
          this.profileModal(this.email);
        }
        else {
          let myProfile = JSON.parse(profileData);
          if (!myProfile.email){
            this.profileModal(this.email);
          }
          else {
            this.name = myProfile.email;
            this.loadCachedNewDocWhenLoggedIn();
          }
        }

      //}

    } else if (blockstack.isSignInPending()) {

      this.cacheNewDocIfNotLoggedIn();

      blockstack.handlePendingSignIn().then(function (userData) {
        window.location = window.location.origin
        this.documentsGetList();
      });
    }
    else {
      if (localStorage.getItem('signUp') !== 'true') {
        window.location.href = "signup.html";
      }
      else {
        localStorage.setItem('signUp', 'true');
        this.login();
      }

    }
  }

  cacheNewDocIfNotLoggedIn() {
    alert('caching doc');
  }

  loadCachedNewDocWhenLoggedIn() {
    alert('load cached doc');
  }

  public setupDiscordMenu() {
    $(".focusable, .button").forEach(el => {
      // blur only on mouse click
      // for accessibility, keep focus when keyboard focused
      el.addEventListener("mousedown", e => e.preventDefault());
      el.setAttribute("tabindex", "0");
    });

    $(".server").forEach(el => {
      el.addEventListener("click", () => {
        const activeServer = $(".server.active")[0];
        activeServer.classList.remove("active");
        activeServer.removeAttribute("aria-selected");

        el.classList.add("active");
        el.setAttribute("aria-selected", true);
      });
    })

    $(".channel-text").forEach(el => {
      el.addEventListener("click", () => {
        $(".channel-text.active")[0].classList.remove("active");
        el.classList.add("active");
      });
    })

    // focus/blur on channel header click
    $(".channels-header")[0].addEventListener("click", e => {
      e.preventDefault();

      const focused = document.activeElement === e.target;
      focused ? e.target.blur() : e.target.focus();
    });
  }

  documentSelected(e, selectedDocument) {

    this.documentService.currentDoc = selectedDocument;
    this.next();
  }




  documentsGetList() {
    this.documentService.getDocumentsIndex(true).then((data) => {
      this.documentsList = this.documentService.documentsListFiltered; //data;
    });
  }


  presentPopover(myEvent, item) {
    let popover = this.popoverCtrl.create(OptionsPopoverPage, { selectedDoc: item });
    popover.present({
      ev: myEvent,

    });
  }

  clearActive() {

    $(".channel-text").forEach(el => {
      try {
        $(".channel-text.active")[0].classList.remove("active");
      }
      catch (e) { }
    });
  }

  profileModal(email) {

    let alert = this.alertCtrl.create({
      title: 'Please enter your email',
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'email',
          placeholder: 'email',
          value: email
        }
      ],
      buttons: [
        // {
        //   text: 'Cancel',
        //   role: 'cancel',
        //   handler: data => {
        //     console.log('Cancel clicked');
        //   }
        // },
        {
          text: 'Ok',
          handler: data  => {

            if (data.email.indexOf("@") != -1) {
              // logged in!
              // save here
              this.blockStackService.setProfileData(data.email).then( () =>
              {
                location.reload();
              });
            } else {
              // invalid login
              this.showErrorToast('Invalid Email');
              return false;
            }
          }
        }
      ]
    });
    alert.present();
  }

  showErrorToast(data: any) {
    let toast = this.toastCntrl.create({
      message: data,
      duration: 3000,
      position: 'top'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }


  filterDocumentList(signer, e){
    this.documentService.filterDocuments(signer);
    this.documentsList = this.documentService.documentsListFiltered;
   

    const activeServer = $(".server.active")[0];
    activeServer.classList.remove("active");
    activeServer.removeAttribute("aria-selected");

    e.currentTarget.classList.add("active");
    e.currentTarget.setAttribute("aria-selected", true);
    
  }

  copyBtc(){
    let el = document.getElementById('btc');

    el.select();
    document.execCommand("copy");

    let toast = this.toastCntrl.create({
      message: 'BTC Address copied ' + el.value,
      duration: 2000,
      position: 'middle'
    });
  
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
  
    toast.present();
  }

}



