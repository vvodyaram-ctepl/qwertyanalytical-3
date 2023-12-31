import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CustomDateFormatPipe } from 'src/app/pipes/custom-date-format.pipe';
import { PetService } from '../../pet.service';

@Component({
  selector: 'app-view-campaign-points',
  templateUrl: './view-campaign-points.component.html',
  styleUrls: ['./view-campaign-points.component.scss']
})
export class ViewCampaignPointsComponent implements OnInit {
  petId: string;
  modalRef: NgbModalRef;
  modalRef2: NgbModalRef;
  studyId: string;
  petCampaignPoints: any;
  showPanelContentData: any;
  redeemPointNumber: any;
  pointsSelected: boolean = false;
  petDetails: any;
  @ViewChild('archiveContent') archiveContent: ElementRef;
  @ViewChild('archiveContent2') archiveContent2: ElementRef;
  // @Output() newItemEvent = new EventEmitter<string>();
  headers: ({ key: string; label: string; checked: boolean; clickable?: undefined; width?: undefined; } | { key: string; label: string; checked: boolean; clickable: boolean; width: number; })[];
  redemptionHistory: { key: string; label: string; checked: boolean; }[];
  questionnaireHeaders: { key: string; label: string; checked: boolean; }[];

  constructor(
    private petService: PetService,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private modalService: NgbModal,
    public router: Router,
    private spinner: NgxSpinnerService,
    private customDatePipe: CustomDateFormatPipe
  ) { }

  ngOnInit(): void {
    this.headers = [
      { key: "createdDate", label: "Date", checked: true },
      { key: "campaignName", label: "Campaign", checked: true },
      { key: "observation", label: "Observation", checked: true },
      { key: "behaviourName", label: "Behavior", checked: true },
      { key: "imageUrl", label: "Media", checked: true },
      { key: "points", label: "Points", checked: true },
      { key: "status", label: "Status", checked: true }
    ];

    this.redemptionHistory = [
      { key: "createdDate", label: "Date", checked: true },
      { key: "totalPoints", label: "Available Points", checked: true },
      { key: "pointsRedeemed", label: "Points Redeemed", checked: true },
      { key: "balancePoints", label: "Balance", checked: true },
      { key: "redeemedByUser", label: "Redeemed By", checked: true }
    ];

    this.questionnaireHeaders = [
      { key: "createdDate", label: "Date", checked: true },
      { key: "campaignName", label: "Campaign", checked: true },
      { key: "questionnaireName", label: "Questionnaire Name", checked: true },
      { key: "points", label: "Points", checked: true },
      { key: "status", label: "Status", checked: true }
    ];

    this.activatedRoute.params.subscribe(async params => {
      let str = this.router.url;
      this.petId = str.split("view/")[1].split("/")[0];
      this.studyId = str.split("view/")[1].split("/")[1];
    })

    this.getInitialData();

    this.loadContent(1);
  }

  getInitialData() {
    //get campaign points
    this.spinner.show();

    this.petService.getPet(`/api/pets/getPetDetailsById/${this.petId}`, '').subscribe(res => {
      if (res.status.success === true) {
        console.log(res);
        this.petDetails = res.response.petDTO;
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      this.spinner.hide();
      if (err.status == 500) {
        this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
      }
      else {
        this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      }
    });

    this.getCampaignPoints();
  }

  getCampaignPoints() {
    this.petService.getPet(`/api/pets/getPetCampaignPoints/${this.petId}`, '').subscribe(res => {
      if (res.status.success === true) {
        this.petCampaignPoints = res.response;
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      if (err.status == 500) {
        this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
      }
      else {
        this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      }
      this.spinner.hide();
    });
  }

  openPopup(div, size) {
    console.log('div :::: ', div);
    this.modalRef = this.modalService.open(div, {
      size: size,
      windowClass: 'smallModal',
      backdrop: 'static',
      keyboard: false
    });
    this.modalRef.result.then((result) => {
      console.log(result);
    }, () => {
    });
  }

  openPopup2(div, size) {
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

  redeem() {
    this.redeemPointNumber = '';
    this.openPopup(this.archiveContent, 'xs');
  }

  redeemPoints() {
    if (this.redeemPointNumber <= this.petCampaignPoints.redeemablePoints) {
      if (this.redeemPointNumber == '' || this.redeemPointNumber == undefined) {
        this.toastr.error("Please select the Redeemable points");
      } else {
        this.openPopup2(this.archiveContent2, 'xs');
      }
    } else {
      this.toastr.error("You have less Redeemable Points.");
      this.redeemPointNumber = '';
    }
  }

  submitRedeem() {
    this.petService.redeem(`/api/pets/redeemRewardPoints/${this.petId}/${this.redeemPointNumber}`, {}).subscribe(res => {
      if (res.status.success === true) {
        this.toastr.success(res.response.message);
        this.getCampaignPoints();
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.modalRef.close();
      this.modalRef2.close();
    }, err => {
      if (err.status == 500) {
        this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
      }
      else {
        this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      }
    });
  }

  discardRedeem() {
    this.modalRef2.close();
  }

  loadContent(activityId) {
    this.spinner.show();
    this.petService.getPet(`/api/pets/getPetCampaignPointsList/${this.petId}/${activityId}`, '').subscribe(res => {
      if (res.status.success === true) {
        this.showPanelContentData = res.response.petCampaignList;
        this.showPanelContentData.forEach(ele => {
          ele.createdDate = this.customDatePipe.transform(ele.createdDate, 'MM/dd/yyyy');
          if (ele.status == 'Rejected' || ele.status == 'Pending') {
            ele.points = 'NA'
          }
          if (ele.status == 'Pending') {

          }
        }
        )
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      if (err.status == 500) {
        this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
      }
      else {
        this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      }
      this.spinner.hide();
    });
  }

  loadRedemptionHistory() {
    this.spinner.show();
    this.petService.getPet(`/api/pets/getPetRedemptionHistory/${this.petId}`, '').subscribe(res => {
      if (res.status.success === true) {
        this.showPanelContentData = res.response.redemptionHistoryList;
        this.showPanelContentData.forEach(ele => {
          ele.createdDate = this.customDatePipe.transform(ele.createdDate, 'MM/dd/yyyy');
        });
      }
      else {
        this.toastr.error(res.errors[0].message);
      }
      this.spinner.hide();
    }, err => {
      if (err.status == 500) {
        this.toastr.error(err.error.message + ". " + "Please try after sometime or contact administrator.");
      }
      else {
        this.toastr.error(err.error.errors[0]?.message || 'Something went wrong. Please try after sometime or contact administrator.');
      }
      this.spinner.hide();
    });
  }

}
