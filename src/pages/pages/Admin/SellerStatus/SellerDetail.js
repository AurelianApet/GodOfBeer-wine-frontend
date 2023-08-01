import React, {Component} from 'react';
import _ from 'lodash';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {executeQuery} from '../../../../library/utils/fetch';
import BeerTable,
{
    MODE_DATA,
    TYPE_DATETIME
} from '../../../components/BeerTable';

import {findFromArray} from '../../../../library/utils/array';
import {
    pushNotification,
    NOTIFICATION_TYPE_ERROR,
    NOTIFICATION_TYPE_SUCCESS
} from '../../../../library/utils/notification';
import QRCodeRegisterComponent from '../../Seller/QRCodeRegister/QRCodeRegisterComponent';
import OrderTabletKeyComponent from '../../Seller/OrderTabletKey';
import Loading from '../../../components/Loading';
import UserDetailModal from '../UserDetailModal';
import SellerMenuComponent from '../../Seller/SellerMenu/SellerMenuComponent';
import SellerRemainComponent from '../../../components/SellerRemain/index';
import { params } from '../../../../params';


class SellerDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sData: [],
            sMainMenu: [],
            sOtherMenu: [],
            sBarcodes: [],
            softKeys: [],
            kitSoftKeys: [],
            sPubData: [],
            sFetchStatus: {},
            sIsUserDiableModal: false,
            showTab: 1,
            sBeerDataRemain: []
        };
        this.columns = [
            {
                name: 'userID',
                title: 'ID',
            },
            {
                name: 'email',
                title: '등록 이메일',
            },
            {
                name: 'bus_id',
                title: '사업자번호'
            },
            {
                name: 'callNumber',
                title: '전화번호',
            },
            {
                name: 'phoneNumber',
                title: '담당자 연락처'
            },
            {
                name: 'storeName',
                title: '회사명',
            },
            {
                name: 'realName',
                title: '담당자',
            },
            {
                name: 'reg_datetime',
                title: '회원 가입일',
                type: TYPE_DATETIME
            },
        ]
    }

    componentDidMount = () => {
        this.getUserDetail();
        this.getPubInfo();
    };

    getUserDetail = () => {
        const userId = _.get(this.props, 'match.params.id') || '';
        executeQuery({
            method: 'get',
            url: `user/fetchone?id=${userId}`,
            success: (res) => {
                let {sFetchStatus} = this.state;
                const user = _.get(res, 'user');
                sFetchStatus.user = true;
                this.setState({
                    sFetchStatus,
                    sData: [user] || []
                })
            },
            fail: (err) => {

            }
        })
    };

    getPubInfo = () => {
        const userId = _.get(this.props, 'match.params.id') || '';
        if (userId) {
            executeQuery({
                method: 'get',
                url: `/pub/fetchone?uid=${userId}`,
                success: (res) => {
                    let {sFetchStatus} = this.state;
                    const result = _.get(res, 'pub') || {};
                    let equipment = _.get(res, 'equipment');
                    const barcodes = result.barcodes || [];
                    this.pubId = result.id || '';
                    sFetchStatus.pub = true;
                    this.setState({
                        sFetchStatus,
                        sBarcodes: barcodes,
                        sPubData: result,
                        softKeys: res.softKeys,
                        kitSoftKeys: res.kitSoftKeys,
                        sBeerDataRemain: equipment
                    });
                },
                fail: (err, res) => {
                    const errMsg = _.get(err, 'data.error');
                    pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
                }
            })
        }
    };

    handleSaveMenu = () => {
        if (!this.modified) return;
        const {sMainMenu, sOtherMenu} = this.state;
        let mainMenu = [];
        let otherMenu = [];
        let orders = [];
        let orderDuplicated = false;
        _.map(sMainMenu, (menuItem, menuIndex) => {
            const order = this.menuOrder[menuIndex] || 1;
            if (!findFromArray(orders, '', order)) {
                orders.push(order);
            } else {
                orderDuplicated = true;
            }
            _.map(menuItem, (item, index) => {
                mainMenu.push({
                    no: order,
                    bottleType: menuIndex,
                    beerName: item.beerName,
                    price: item.price,
                    beer: item.beer,
                    capacity: item.capacity,
                    createAt: new Date(),
                    soldOut: item.soldOut,
                    id: item.id || null
                });
            });
        });
        _.map(sOtherMenu, (menuItem, menuIndex) => {
            const order = this.menuOrder[menuIndex] || 1;
            if (!findFromArray(orders, '', order)) {
                orders.push(order);
            } else {
                orderDuplicated = true;
            }
            _.map(menuItem, (item, index) => {
                otherMenu.push({
                    no: this.menuOrder[menuIndex] || 1,
                    kind: menuIndex,
                    foodName: item.foodName,
                    price: item.price,
                    content: item.content,
                    image: item.image || '',
                    soldOut: item.soldOut || false,
                    id: item.id || null
                });
            });
        });
        if (orderDuplicated) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '메뉴순서를 확인해주세요.');
            return;
        }
        executeQuery({
            method: 'put',
            url: `/pub/updatemenu/${this.pubId}`,
            data: {
                mainMenu,
                otherMenu,
            },
            success: (res) => {
                this.modified = false;
                pushNotification(NOTIFICATION_TYPE_SUCCESS, '성공적으로 저장되었습니다.')
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    handleUserDisable = () => {
        this.setState({sIsUserDiableModal: true})
    };

    handleUserLimited = () => {
        const {sData} = this.state;
        const userId = _.get(this.props, 'match.params.id') || '';
        if (userId) {
            executeQuery({
                method: 'put',
                url: `/user/limited/${userId}`,
                data: {
                    is_limited: !sData[0].is_limited
                },
                success: (res) => {
                    const result = res.doc || {};
                    this.setState({
                        sData: [result],
                    });
                    pushNotification(NOTIFICATION_TYPE_SUCCESS, '성공');
                },
                fail: (res) => {
                    const errResult = _.get(res, 'data.error') || '';
                    if (errResult) {
                        pushNotification(NOTIFICATION_TYPE_ERROR, errResult);
                    }
                }
            })
        }
    };

    handleClickEnableUserButton = () => {
        const {sData} = this.state;
        if (!this.userDetailModal.refuseReason) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '차단사유를 입력하세요.');
            return;
        }
        executeQuery({
            method: 'put',
            url: `user/enable/${_.get(sData, '[0].id')}`,
            data: {
                active: params.blocked,
                cancelReason: this.userDetailModal.refuseReason,
            },
            success: (res) => {
                pushNotification(NOTIFICATION_TYPE_SUCCESS, '사용자 차단되었습니다');
                let data = sData;
                data[0].active = params.deactive;
                this.setState({
                    sIsUserDiableModal: false,
                    sData : data
                });
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    handleCloseEnableModal = () => {
        this.setState({sIsUserDiableModal: false})
    };

    handleSellerStatistic = () => {
        const {sPubData} = this.state;
        this.props.history.push(`/seller/sellerdetail/${sPubData.id}/sellerstatistic`);
    };

    handleBeerMount = () => {
        const userId = _.get(this.props, 'match.params.id') || '';
        this.props.history.push(`/seller/sellerdetail/${userId}/restbeer`);
    };

    handleShowTab = (val) => {
        this.setState({showTab: val});
    };
            
    render() {
        const userId = _.get(this.props, 'match.params.id') || '';
        const {sData, sBarcodes, sFetchStatus, sIsUserDiableModal, softKeys, kitSoftKeys, showTab, sBeerDataRemain} = this.state;
        if (sFetchStatus.user && sFetchStatus.pub) {
            return (
                <div>
                    <div className='container-page-seller-detail'>
                        <div className='container-page-seller-info'>
                            <div className="page-title-container">
                                <div className='privider-info-title'><span>{'판매자정보'}</span></div>
                                <div className='seller-detail-user-manager'>
                                    <button className='user-manager-button' onClick={() => {this.handleShowTab(1)}}>메뉴등록</button>
                                    <button className='user-manager-button' onClick={() => {this.handleShowTab(2)}}>와인잔량</button>
                                    <button className='user-manager-button' onClick={this.handleSellerStatistic}>매출보기
                                    </button>
                                    <button className='user-manager-button' onClick={this.handleUserDisable}>사용차단
                                    </button>
                                    <button className='user-manager-button'
                                            onClick={this.handleUserLimited}>{sData[0].is_limited ? '제한해제' : '기능제한'}</button>
                                </div>
                            </div>
                            <div className='seller-user-info-content'>
                                {
                                    <BeerTable
                                        onRef={(ref) => {
                                            this.beerTable = ref
                                        }}
                                        mode={MODE_DATA}
                                        pColumns={this.columns}
                                        pData={sData}
                                    />
                                }
                                {
                                    showTab === 1 &&
                                    <div style={{fontWeight: 'bold', fontSize: 16, marginTop: '40px'}}>메뉴</div>
                                }
                                <div className='seller-detail-menu-content'>
                                    {
                                        showTab === 1 &&
                                        <SellerMenuComponent
                                            userId={userId}
                                            userKind={'uid'}
                                        />
                                    }
                                    {
                                        showTab === 2 &&
                                        <SellerRemainComponent
                                            sBeerRemainData={sBeerDataRemain}/>
                                    }
                                </div>

                                {
                                        showTab === 1 &&
                                        <div>
                                            <div style={{fontWeight: 'bold', fontSize: 16}}>주문태블릿 key</div>
                                            <div className='seller-detail-qrcode-content'>
                                                <OrderTabletKeyComponent data={softKeys} pubId={this.pubId}/>
                                            </div>
            
                                            <div style={{fontWeight: 'bold', fontSize: 16}}>주방태블릿 key</div>
                                            <div className='seller-detail-qrcode-content'>
                                                <OrderTabletKeyComponent data={kitSoftKeys} pubId={this.pubId} isKitchen={true}/>
                                            </div>
                                        </div>
                                    }
{/* 
                                <div style={{fontWeight: 'bold', fontSize: 16}}>QR코드 등록</div>
                                <div className='seller-detail-qrcode-content'>
                                    <QRCodeRegisterComponent
                                        data={sBarcodes}
                                        pubId={this.pubId}
                                    />
                                </div> */}
                            </div>
                        </div>
                        {
                            sIsUserDiableModal &&
                            <UserDetailModal
                                onRef={(ref) => {
                                    this.userDetailModal = ref
                                }}
                                userData={sData[0]}
                                handleCloseModal={this.handleCloseEnableModal}
                                handleClickEnableUserButton={this.handleClickEnableUserButton}
                                hasOperationButton={true}
                            />
                        }
                    </div>
                </div>
            );
        } else {
            return (
                <div className="loading-wrapper">
                    <Loading/>
                </div>
            )
        }
    }
}

SellerDetail.propTypes = {};

SellerDetail.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
        }),
    )
)(SellerDetail);
