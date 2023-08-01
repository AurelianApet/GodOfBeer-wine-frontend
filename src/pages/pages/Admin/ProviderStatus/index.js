import React, {Component} from 'react';
import _ from 'lodash';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {executeQuery} from '../../../../library/utils/fetch';
import BeerTable, {MODE_DATA, TYPE_NO, TYPE_DATETIME, TYPE_COUNT} from '../../../components/BeerTable';
import {
    pushNotification,
    NOTIFICATION_TYPE_ERROR,
    NOTIFICATION_TYPE_SUCCESS
} from '../../../../library/utils/notification';
import UserDetailModal from '../UserDetailModal';
import SearchInputer from '../../../components/SearchInputer';
import Loading from '../../../components/Loading';
import CreateProviderModal from "./CreateProviderModal";
import md5 from "md5";
import { params } from '../../../../params';


const CREATE_COLUMNS = [
    {
        name: 'storeName',
        title: '회사명',
    },
    {
        name: 'userID',
        title: 'ID',
    },
    {
        name: 'email',
        title: '이메일',
    },
    {
        name: 'realName',
        title: '담당자',
    },
    {
        name: 'callNumber',
        title: '담당자번호',
    },
    {
        name: 'password',
        title: '암호',
    }
];


class ProviderStatus extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sEnableItem: null,
            sIsShowEnableModal: false,
            sUsers: [],
            sOriginUsers: [],
            sFetchStatus: false,
            sIsMobileDimension: props.isMobileDimension,
            sSearchWord: props.searchWord
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({
            sIsMobileDimension: nextProps.isMobileDimension,
            sSearchWord: nextProps.searchWord
        });

        let pData = this.state.sOriginUsers;
        let result = [];
        _.map(pData, (dataItem, dataIndex) => {
            const contentString = JSON.stringify(dataItem).toLowerCase();
            if (contentString.indexOf(nextProps.searchWord) > -1) {
                result.push(dataItem);
            }
        });
        this.setState({sUsers: result});
    }

    componentDidMount = () => {
        this.getUsers();
    };

    getUsers = () => {
        executeQuery({
            method: 'get',
            url: `user/fetchallByRole?role_id=${params.ROLE_PROVIDER}`,
            success: (res) => {
                const result = res.users || [];
                _.map(result, (user, index) => {
                    user.companyType = user.companyType === params.importer ? '수입사' : '양조장'
                });
                this.setState({
                    sFetchStatus: true,
                    sUsers: result || [],
                    sOriginUsers: result || [],
                })
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        });
    };

    handleClickStatusTable = (value, dataItem, columnItem) => {
        this.setState({
            sEnableItem: dataItem,
            sIsShowEnableModal: true,
        })
    };

    handleCloseEnableModal = () => {
        this.setState({
            sEnableItem: null,
            sIsShowEnableModal: false,
        })
    };

    handleClickEnableUserButton = (aState) => {
        const {sEnableItem} = this.state;
        if (!aState && !this.userDetailModal.refuseReason) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '차단사유를 입력하세요.');
            return;
        }
        executeQuery({
            method: 'put',
            url: `user/enable/${sEnableItem.id}`,
            data: {
                active: aState ? params.active : params.blocked,
                cancelReason: this.refuseReason,
            },
            success: (res) => {
                this.setState({
                    sEnableItem: null,
                    sIsShowEnableModal: false,
                });
                this.beerTable.refresh();
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    handleSearchWordInputed = (aData) => {
        this.setState({
            sUsers: aData,
        });
    };

    handleClickDetailShow = (value, dataItem, columnItem) => {
        this.props.history.push(`/admin/provider/providerdetail/${dataItem.id}`);
    };

    handleCreateProvider = () => {
        this.setState({
            sModalShow: true,
        })
    };

    handleCloseInsertModal = () => {
        this.setState({sModalShow: false})
    };

    handleInsertUserButton = () => {
        executeQuery({
            method: 'post',
            url: '/user/provider/create',
            data: {
                ...this.insertUserModal.userData,
                password: md5(this.insertUserModal.userData.password),
            },
            success: (res) => {
                pushNotification(NOTIFICATION_TYPE_SUCCESS, '추가 성공');
                this.getUsers();
                this.beerTable.refresh();
                this.setState({sModalShow: false});
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error') || '추가 실패';
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };


    render() {
        const {sEnableItem, sIsShowEnableModal, sUsers, sOriginUsers, sFetchStatus, sIsMobileDimension, sSearchWord, sModalShow} = this.state;
        if (sFetchStatus) {
            return (
                <div className='container-page-provider-status'>
                    <div className='provider-status-container'>
                        <div className='provider-status-table-header'>
                            <div className='table-title'>본사관리자</div>
                            <div className="right-button-content">
                                <button className="control-button" onClick={this.handleCreateProvider}>추가</button>
                            </div>
                        </div>
                        {
                            sIsMobileDimension &&
                            <div className='provider-status-search-panel'>
                                <SearchInputer
                                    pData={sOriginUsers}
                                    defaultData={sSearchWord}
                                    pHandleSearch={this.handleSearchWordInputed}
                                />
                            </div>
                        }
                        <BeerTable
                            onRef={(ref) => {
                                this.beerTable = ref
                            }}
                            mode={MODE_DATA}
                            pColumns={[
                                {
                                    type: TYPE_NO,
                                    title: 'NO.'
                                },
                                {
                                    name: 'storeName',
                                    title: '회사명',
                                    className: 'provider-detail-show',
                                    clickFunc: this.handleClickDetailShow
                                },
                                {
                                    name: 'userID',
                                    title: 'ID',
                                },
                                {
                                    name: 'email',
                                    title: '이메일',
                                },
                                {
                                    name: 'reg_datetime',
                                    title: '등록일',
                                    type: TYPE_DATETIME
                                },
                                {
                                    name: 'pubs',
                                    title: '관리매장',
                                    type: TYPE_COUNT
                                }
                            ]}
                            pData={sUsers}
                        />
                    </div>
                    {sIsShowEnableModal &&
                    <UserDetailModal
                        onRef={(ref) => {
                            this.userDetailModal = ref
                        }}
                        userData={sEnableItem}
                        handleCloseModal={this.handleCloseEnableModal}
                        handleClickEnableUserButton={this.handleClickEnableUserButton}
                    />
                    }
                    {
                        sModalShow &&
                        <CreateProviderModal
                            onRef={(ref) => {
                                this.insertUserModal = ref
                            }}
                            handleCloseModal={this.handleCloseInsertModal}
                            handleInsertUserButton={this.handleInsertUserButton}
                            columns={CREATE_COLUMNS}
                        />
                    }
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

ProviderStatus.propTypes = {};

ProviderStatus.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
            searchWord: state.search.searchWord
        }),
    )
)(ProviderStatus);