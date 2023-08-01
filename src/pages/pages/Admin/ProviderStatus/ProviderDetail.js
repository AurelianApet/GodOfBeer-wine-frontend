import React, {Component} from 'react';
import _ from 'lodash';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {executeQuery} from '../../../../library/utils/fetch';
import BeerTable, {MODE_DATA, TYPE_NO, TYPE_IMG, TYPE_DATETIME} from '../../../components/BeerTable';
import Loading from '../../../components/Loading';
import UserDetailModal from '../UserDetailModal';
import {
    pushNotification,
    NOTIFICATION_TYPE_ERROR,
    NOTIFICATION_TYPE_SUCCESS
} from '../../../../library/utils/notification';
import { params } from '../../../../params';

class ProviderDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sData: [],
            sFetchStatus: false,
            sIsUserDiableModal: false,
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
                name: 'companyType',
                title: '공급자구분',
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
    };

    getUserDetail = () => {
        const userId = _.get(this.props, 'match.params.id') || '';
        executeQuery({
            method: 'get',
            url: `user/fetchone?id=${userId}`,
            success: (res) => {
                const user = _.get(res, 'user');
                this.setState({
                    sFetchStatus: true,
                    sData: [user] || []
                })
            },
            fail: (err) => {

            }
        })
    };

    renderBeerDetail = () => {
        const userId = _.get(this.props, 'match.params.id') || '';
        return (
            <BeerTable
                onRef={(ref) => {
                    this.beerTable = ref
                }}
                url={`/brewery/fetchlist?uid=${userId}`}
                getDataFunc={(res) => {
                    return res.brewery || []
                }}
                pColumns={[
                    {
                        type: TYPE_NO,
                        title: 'NO.'
                    },
                    {
                        name: 'image',
                        title: 'BeerImage',
                        type: TYPE_IMG,
                    },
                    {
                        name: 'name',
                        title: '양조장 명',
                    },
                    {
                        name: 'content',
                        title: 'information',
                    },
                ]}
            />
        )
    };

    handleUserDisable = () => {
        this.setState({sIsUserDiableModal: true})
    };

    handleCloseEnableModal = () => {
        this.setState({sIsUserDiableModal: false})
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
                this.setState({
                    sIsUserDiableModal: false,
                });
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    render() {
        const {sData, sFetchStatus, sIsUserDiableModal} = this.state;
        if (sFetchStatus) {
            return (
                <div className='containter-page-provider-back'>
                    <div className='container-page-provider-detail'>
                        <div className='container-page-provider-info'>
                            <div className='provider-info-title'>
                                <span>{'공급자정보'}</span>
                                <button className='provider-btn-disable' onClick={this.handleUserDisable}>
                                    사용차단
                                </button>
                            </div>
                            <div className='provider-info-content'>
                                <div className='provider-info-table'>
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
                                </div>
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

                        <div className='container-page-provider-beer-info'>
                            <div className='provider-beer-title'><span>{'와인정보'}</span></div>
                            <div className='provider-beer-content'>
                                {
                                    this.renderBeerDetail()
                                }
                            </div>
                        </div>
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

ProviderDetail.propTypes = {};

ProviderDetail.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
        }),
    )
)(ProviderDetail);