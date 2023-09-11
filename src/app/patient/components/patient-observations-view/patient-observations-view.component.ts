import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PetService } from '../../pet.service';
import * as $ from 'jquery';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserDataService } from 'src/app/services/util/user-data.service';
import { saveAs } from 'file-saver';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookupService } from 'src/app/services/util/lookup.service';
import * as moment from 'moment';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-patient-observations-view',
  templateUrl: './patient-observations-view.component.html',
  styleUrls: ['./patient-observations-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PatientObservationsViewComponent implements OnInit {
  public baseurl = environment.baseUrl;
  barcodeScr: string;
  modalRef2: NgbModalRef;
  petId: any;
  studyId: any;
  petObservations: any = [];
  RWFlag: boolean = false;
  checkBox: any;
  public rolesForm: FormGroup;
  permissionMap: FormArray;
  permissionMap1: FormArray;
  permissionMap2: FormArray;

  pagination: any = {
    page: 1,
    totalElements: 10,
    noOfElements: 5
  };
  sortByColumn: any;
  sortDirection: any;
  defaultColumn: any;
  query: any;
  filterType: string = '';
  filterValue: any = '';
  filterTypeArr: { name: string; id: string; }[];
  filterdrop: boolean;
  FilterFlag: boolean = false;//filtering
  filterDropdown: boolean = true;
  filterValArr: any[];
  endDate: any;
  startDate: any;
  studyList: any;
  filterFlag: boolean = false;
  petName: any;
  @ViewChild('archiveContent') archiveContent: ElementRef;
  spinnerFlag: boolean = false;
  paginationFlag: boolean;

  constructor(
    private petService: PetService,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    public router: Router,
    private spinner: NgxSpinnerService,
    private userDataService: UserDataService,
    private fb: FormBuilder,
    private lookupService: LookupService,
    private customDatePipe: CustomDateFormatPipe,
    private http: HttpClient,
  ) {
    this.rolesForm = this.fb.group(
      {
        // petName: [''],
        // petType: [''],
        // study: [''],
        // permission: [],
        permissionMap: this.fb.array([])
      })
  }

  async ngOnInit() {

    this.filterTypeArr =
      [{
        name: "Study",
        id: "Study"
      },
      {
        name: "Status",
        id: "Status"
      },
      {
        name: "Observation Date",
        id: "dateType"
      }
      ];

    //permission for the module
    let userProfileData = this.userDataService.getRoleDetails();
    console.log("userProfileData", userProfileData);
    let menuActionId = '';
    userProfileData.rolePermissions && userProfileData.rolePermissions.forEach(ele => {
      if (ele.menuId == "27") {
        menuActionId = ele.menuActionId;
      }
    });
    if (menuActionId == "3") {
      this.RWFlag = true;
    }
    let url = 'https://storage.cloud.google.com/wearables-sensor-data-pr/PROD/GCloud/WPortal/MPPhoto/riverdale-veterinary-dermatology-annual-plan.jpg';
    this.barcodeScr = url;

    this.activatedRoute.params.subscribe(async params => {
      let str = this.router.url;
      if (str.split("patient-observations-info/")[1] != undefined) {
        this.petId = str.split("patient-observations-info/")[1].split("/")[0];
        this.studyId = str.split("patient-observations-info/")[1].split("/")[1];
      }
    })

    await this.getInitialData();
    // await this.addItem();
  }

  // createItem() {
  //   return this.fb.group({
  //     // parentMenuName: [''],
  //     // parentMenuId: [''],
  //     ImgMenu: this.fb.array([]),
  //     VidMenu: this.fb.array([])
  //   })
  // }
  onCheckboxChange($event, i, pet) {
    console.log("$event", $event);
    console.log("$event", i);
    // if($event.target.checked == true) {
    this.rolesForm.value.permissionMap.forEach(ele => {
      if (ele.petName == pet) {
        //check the checkboxes ticked
        let checkBoxArr = [];
        ele.permissionMap1.forEach(res => {
          if (res.checkBox == true) {
            checkBoxArr.push(res.fileSize)
          }
        });
        ele.permissionMap2.forEach(res => {
          if (res.checkBox == true) {
            checkBoxArr.push(res.fileSize)
          }
        });
        console.log("checkBoxArr", checkBoxArr);
        let sumOfCheck = 0;
        if (checkBoxArr) {
          checkBoxArr.forEach(ele => {
            sumOfCheck = sumOfCheck + ele;
          })
        }
        let fileType = "Kb"
        if (sumOfCheck > 1024) {
          fileType = "Mb"
        }
        else {
          fileType = "Kb"
        }
        this.rolesForm.controls.permissionMap['controls'][i].patchValue({
          "display": sumOfCheck > 0 ? true : false,
          "filSizeArr": sumOfCheck + " " + fileType
        });

      }
    })
    // }
  }
  createItem() {
    return this.fb.group({
      petName: [''],
      petType: [''],
      study: [''],
      filSizeArr: 0,
      display: false,
      permissionMap1: this.fb.array([]),
      permissionMap2: this.fb.array([])
    })
  }

  createSubMenuVid() {
    return this.fb.group({
      checkBox: false,
      Url: "",
      fileSize: ""
    })
  }
  createSubMenuImg() {
    return this.fb.group({
      checkBox: false,
      Url: "",
      fileSize: ""
    })
  }

  async addItem() {

  }

  startdateSelect() {
    console.log("sdsdsd");
    if (moment(this.endDate) < moment(this.startDate)) {
      this.endDate = "";
    }
  }

  getInitialData() {
    this.spinner.show();
    // Get pet observations
    if (this.petId) {
      this.loadResults();
      // this.petService.getPet(`/api/pets/getPetObservationMedia/${this.petId}`, '').subscribe(res => {
      //   if (res.status.success === true) {
      //     this.petObservations = res.response.rows;
      //     let imgArr = [];
      //     let vidArr = [];
      //     this.petObservations.forEach(ele => {
      //       //for images
      //       let imgs = ele.imagePath;
      //      imgArr = imgs.toString().split(",");
      //      ele['imageList'] = imgArr;
      //      //for videos
      //      let videos = ele.videoURL;
      //      vidArr = videos.toString().split(",");
      //      ele['videoMap'] = vidArr;
      //     })


      //     console.log("this.petObservations", this.petObservations);
      //     this.petObservations.forEach((ele, i) => {
      //       this.permissionMap = this.rolesForm.get('permissionMap') as FormArray;
      //       this.permissionMap.push(this.createItem());

      //       this.rolesForm.controls.permissionMap['controls'][i].patchValue({
      //         "petName": ele.petName ? ele.petName : '',
      //         "petType": ele.breedName ? ele.breedName : '',
      //         "study": ele.studyNames ? ele.studyNames : ''
      //       });

      //       // img map loop
      //       ele.imageList.forEach((res, j) => {

      //         this.permissionMap1 = this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap1') as FormArray;
      //         this.permissionMap1.push(this.createSubMenuImg());
      //         this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap1')['controls'][j].patchValue({
      //           'checkBox': false,
      //           'Url': res
      //         });
      //       });

      //       //video map loop
      //       ele.videoMap.forEach((res, j) => {
      //         this.permissionMap2 = this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap2') as FormArray;
      //         this.permissionMap2.push(this.createSubMenuVid());
      //         this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap2')['controls'][j].patchValue({
      //           'checkBox': false,
      //           'Url': res
      //         });
      //       });


      //     });

      //   }
      //   else {
      //     this.toastr.error(res.errors[0].message);
      //   }
      //   this.spinner.hide();
      // }, err => {
      //   this.spinner.hide();
      //   this.toastr.error(err.error.errors[0] ?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      // });
    }
    else {

      // Get pet observations
      this.loadResults()
    }
  }
  reset() {
    this.query = '';
    this.filterType = '';
    this.filterValue = '';
    this.startDate = '';
    this.endDate = '';
    this.FilterFlag = false;
    this.pagination.page = 1;
    this.pagination.noOfElements = 5;
    this.loadResults();
  }
  searchText(query) {
    if (query == undefined) {
      this.query = "";
    }
    this.pagination.page = 1;
    this.loadResults();

  }
  changeField($event) {
    console.log($event);
    this.filterValArr = [];
    this.filterValue = "";
    this.startDate = "";
    this.endDate = "";

    if (this.filterType == "") {
      this.filterValArr = [];
      this.FilterFlag = false;
      this.filterValue = "";
    }
    else {
      this.FilterFlag = true;
      if (this.filterType == "Status") {
        this.filterdrop = true;
        this.filterValue = "";
        this.filterValArr = [
          {
            name: "Off Study",
            id: "1"
          },
          {
            name: "On Study",
            id: "2"
          },
          {
            name: "Deceased",
            id: "3"
          }
        ]
      }
      else if (this.filterType == "Study") {
        // this.filterdrop = true;
        // this.filterValue = "";
        this.filterdrop = false;
        this.filterValArr = this.studyList;
      }
      else if (this.filterType == "dateType") {
        this.filterdrop = false;
        this.filterValue = "";
      }
    }
  }
  changedInput($event) {
    console.log("You entered: ", $event.target.value);
    this.pagination.page = 1;
    this.loadResults();
  }
  loadResults() {
    this.spinner.show();
    this.lookupService.getCommon('/api/study/getAllStudyList').subscribe(res => {
      if (res.status.success === true) {
        this.studyList = res.response.studyList;
      } else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      this.spinner.hide();
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    });

    if (this.filterType == 'dateType' || this.filterType == 'questionnaireDate') {
      if (this.endDate === '' || this.startDate === '') {
        this.toastr.error("Please select start and end dates.");
        return false;
      }
    }
    this.spinner.show();
    this.spinnerFlag = true;
    this.petObservations = [];
    this.rolesForm.reset();
    console.log("this.rolesForm", this.rolesForm.value)
    this.permissionMap = this.rolesForm.get('permissionMap') as FormArray;

    this.permissionMap.controls = [];

    let startIndex =
      this.pagination.page === 1
        ? 0
        : this.pagination.page * this.pagination.noOfElements -
        this.pagination.noOfElements;
    this.pagination.noOfElements = this.pagination.noOfElements
      ? this.pagination.noOfElements
      : 5;

    var data = {
      startIndex: startIndex,
      endIndex: this.pagination.totalItems
        ? this.pagination.totalItems <
          Number(startIndex) + Number(this.pagination.noOfElements)
          ? this.pagination.totalItems
          : Number(startIndex) + Number(this.pagination.noOfElements)
        : Number(startIndex) + Number(this.pagination.noOfElements),
      limit: this.pagination.noOfElements,
      sortByColumn: this.sortByColumn ? this.sortByColumn : this.defaultColumn,
      // sortDirection: this.sortDirection ? this.sortDirection : this.dir,
      searchText: this.query ? this.query.trim() : '',
      filterType: this.filterType ? this.filterType : '',
      filterValue: this.filterValue ? this.filterValue : '',
      startDate: this.startDate ? this.customDatePipe.transform(this.startDate, 'yyyy-MM-dd') : '',
      endDate: this.endDate ? this.customDatePipe.transform(this.endDate, 'yyyy-MM-dd') : ''
    };
    if (data.startDate || data.searchText || data.filterValue) {
      this.filterFlag = true;
    }
    else {
      this.filterFlag = false;
    }
    if (this.filterType == "Study") {
      data.filterValue = this.filterValue ? this.filterValue.studyName : '';
    }
    let observationUrl = '';
    if (this.petId) {
      this.paginationFlag = false;
      observationUrl = `/api/pets/getPetObservationMedia/${this.petId}`;
    }
    else {
      this.paginationFlag = true;
      observationUrl = `/api/pets/getPetObservationMediaList`;
    }

    this.petService.getPet(`${observationUrl}?startIndex=${data.startIndex}&limit=${data.limit}&sort=name&order=DESC&searchText=${data.searchText}&filterType=${data.filterType}&filterValue=${data.filterValue}&startDate=${data.startDate}&endDate=${data.endDate}
    `, '').subscribe(res => {

      if (res.status.success === true) {
        this.pagination.totalElements = res.response.totalElements;
        this.pagination.searchElments = res.response.searchElments;

        this.petObservations = res.response.rows;
        let imgArr = [];
        let vidArr = [];
        this.petObservations.forEach(ele => {
          //for images
          if (ele.imagePath) {
            let imgs = ele.imagePath + "";
            console.log("imgs", imgs.toString().split(","))
            imgArr = imgs.toString().split(",");
            ele['imageList'] = imgArr;
          }
          //for videos
          if (ele.videoURL) {
            let videos = ele.videoURL;
            vidArr = videos.toString().split(",");
            ele['videoMap'] = vidArr;
          }
        })


        console.log("this.petObservations", this.petObservations);
        this.petObservations.forEach((ele, i) => {
          this.permissionMap = this.rolesForm.get('permissionMap') as FormArray;
          this.permissionMap.push(this.createItem());

          this.rolesForm.controls.permissionMap['controls'][i].patchValue({
            "petName": ele.petName ? ele.petName : '',
            "petType": ele.breedName ? ele.breedName : '',
            "study": ele.studyNames ? ele.studyNames : ''
          });

          // img map loop
          if (ele.imageList) {
            ele.imageList.forEach((res, j) => {

              this.permissionMap1 = this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap1') as FormArray;
              this.permissionMap1.push(this.createSubMenuImg());
              this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap1')['controls'][j].patchValue({
                'checkBox': false,
                'Url': res,
                'fileSize': 25
              });
            });
          }

          //video map loop
          if (ele.videoMap) {
            ele.videoMap.forEach((res, j) => {
              this.permissionMap2 = this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap2') as FormArray;
              this.permissionMap2.push(this.createSubMenuVid());
              this.rolesForm.get('permissionMap')['controls'][i].get('permissionMap2')['controls'][j].patchValue({
                'checkBox': false,
                'Url': res,
                'fileSize': 25
              });
            });
          }

        });

      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinnerFlag = false;
      this.spinner.hide();
    }, err => {
      this.spinnerFlag = false;
      this.spinner.hide();
      this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
    });
  }
  pageChanged() {
    // this.selectAll = false;
    this.loadResults();
    $('.page-wrapper').scrollTop(0);
  }

  download(fileUrl) {
    let headers = { "Content-Type": "application/json" };
    this.spinner.show();
    this.http.get(environment.baseUrl + `/api/pets/downloadPetMedia?mediaUrl=${fileUrl.toString()}`, {
      responseType: 'arraybuffer', headers: headers
    }).subscribe(response => {
      this.downLoadFile(response, "application/zip");
      this.spinner.hide()
    }, err => {
      console.log(err);
      this.spinner.hide()
    },)
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type });
    let url = window.URL.createObjectURL(blob);
    let a: any = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = "observation_media.zip";
    a.click();
    let pwa = window.URL.revokeObjectURL(url);
  }

  openPopup(div, size) {
    console.log('div :::: ', div);
    this.modalRef2 = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
    this.modalRef2.result.then((result) => {
      console.log(result);
    }, () => {
    });
  }

  downloadPop(pet, fileSize) {
    this.petName = pet;
    if (fileSize == '0Kb' || fileSize == '0') {
      this.toastr.error("Please select a file to download");
    }
    else if (fileSize == '300Mb') {
      this.toastr.error("Please select files less than 300 Mb");
    }
    else {
      this.openPopup(this.archiveContent, 'xs');
    }
    console.log("fileSize", fileSize)

  }
  downloadT() {
    let pet = this.petName;
    console.log("petName", pet);
    console.log("this.rolesForm.value", this.rolesForm.value);
    this.rolesForm.value.permissionMap.forEach(ele => {
      if (ele.petName == pet) {
        //check the checkboxes ticked
        let checkBoxArr = [];
        ele.permissionMap1.forEach(res => {
          if (res.checkBox == true) {
            checkBoxArr.push(res.Url)
          }
        });
        ele.permissionMap2.forEach(res => {
          if (res.checkBox == true) {
            checkBoxArr.push(res.Url)
          }
        });
        console.log("checkBoxArr", checkBoxArr);

        if (checkBoxArr.length > 0) {
          let checkBoxlist = [];
          checkBoxArr.forEach(ele => {
            if (ele.includes("mp4")) {
              ele = 'https://storage.googleapis.com/wearables-sensor-data-pr/UAT/GCloud/WPortal/ObservationVideo' + ele
              checkBoxlist.push(ele);
            }
            else {
              ele = 'https://storage.googleapis.com/wearables-sensor-data-pr/UAT/GCloud/WPortal/ObservationPhoto/' + ele
              checkBoxlist.push(ele);
            }
          });
          this.download(checkBoxlist);
        }
      }
    })
  }

}
