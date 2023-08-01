import React, {Component} from 'react';
import _ from 'lodash';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';

import BreweryTable, {TYPE_NO, TYPE_IMG, TYPE_DETAIL, TYPE_TEXT} from '../../../components/BreweryTable';
import {
    MODE_CREATE, MODE_UPDATE, MODE_READ,
} from '../../../components/APIForm';

import SearchInputer from '../../../components/SearchInputer';
import UpdateModal from './UpdateModal';
import {executeQuery} from '../../../../library/utils/fetch';
import {confirmAlertMsg} from '../../../../library/utils/confirmAlert';
import LANG from '../../../../language';
import Loading from '../../../components/Loading';
import {
    pushNotification,
    NOTIFICATION_TYPE_WARNING,
    NOTIFICATION_TYPE_SUCCESS,
    NOTIFICATION_TYPE_ERROR
} from '../../../../library/utils/notification';

class AbroadBrewery extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sBreweryData: [],
            sFilterBreweryData: [],
            sSearchWord: props.searchWord,
            sFetchStatus: false,
            sIsMobileDimension: props.isMobileDimension,

            sInfoTableMode: MODE_READ,
            sModalMode: MODE_READ,
            sIsShowUpdateModal: false,
            sUpdateId: '',
        }

    }

    componentDidMount = () => {
        this.getBreweryData()
    };

    componentWillReceiveProps = (newProps) => {
        this.setState({
            sIsMobileDimension: newProps.isMobileDimension,
            sSearchWord: newProps.searchWord
        });

        let pData = this.state.sBreweryData;
        let result = [];
        _.map(pData, (dataItem, dataIndex) => {
            const contentString = JSON.stringify(dataItem).toLowerCase();
            if (contentString.indexOf(newProps.searchWord) > -1) {
                result.push(dataItem);
            }
        });
        this.setState({sFilterBreweryData: result});
    };

    handleHideBrewery = () => {
        const selectedBrewry = this.breweryTable.getCheckedItems();
        if (selectedBrewry.length === 0) {
            pushNotification(NOTIFICATION_TYPE_WARNING, '선택된 데이터가 없습니다')
        } else {
            this.processHideBrewery();
        }
    };

    handleShowBrewery = () => {
        const selectedBrewry = this.breweryTable.getCheckedItems();
        if (selectedBrewry.length === 0) {
            pushNotification(NOTIFICATION_TYPE_WARNING, '선택된 데이터가 없습니다')
        } else {
            this.processShowBrewery();
        }
    };

    handleCreateNewBrewery = () => {
        this.setState({
            sIsShowUpdateModal: true,
            sModalMode: MODE_CREATE,
        })
    };

    handleDeleteBrewery = () => {
        const {location: {pathname}} = this.props;
        const selectedBrewry = this.breweryTable.getCheckedItems();
        if (selectedBrewry.length === 0) {
            pushNotification(NOTIFICATION_TYPE_WARNING, '선택된 데이터가 없습니다')
        } else {
            let confirmParam = {
                title: LANG('BASIC_DELETE'),
                detail: LANG('BASIC_ALERTMSG_DELETE_BREWERY'),
                confirmTitle: LANG('BASIC_ALERTMSG_YES'),
                noTitle: LANG('BASIC_ALERTMSG_NO'),
                confirmFunc: this.processDeleteBrewery,
            };
            confirmAlertMsg(confirmParam, pathname);
        }
    };

    handleClickBreweryTable = (value, dataItem, columnItem) => {
        this.setState({
            sUpdateId: dataItem.id,
            sModalMode: MODE_UPDATE,
            sIsShowUpdateModal: true,
        })
    };

    handleModalShowChange = (aState, aComState) => {
        this.setState({
            sIsShowUpdateModal: aState,
        });
        if (aComState) {
            this.getBreweryData();
        }
    };

    handleSearchResult = (aData, aSearchWord) => {
        this.setState({
            sSearchWord: aSearchWord,
            sFilterBreweryData: aData,
        })
    }

    getBreweryData = () => {
        const {sSearchWord} = this.state;
        executeQuery({
            method: 'get',
            url: '/brewery/fetch-type/?type=abroad',
            success: (res) => {
                let result = [];
                let breweries = res.brewery;
                _.map(breweries, (dataItem, dataIndex) => {
                    const contentString = JSON.stringify(dataItem).toLowerCase();
                    if (contentString.indexOf(sSearchWord) > -1) {
                        result.push(dataItem);
                    }
                });
                this.setState({
                    sFetchStatus: true,
                    sBreweryData: res.brewery,
                    sFilterBreweryData: result,
                })
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    processHideBrewery = () => {
        const selectedBrewry = this.breweryTable.getCheckedItems();
        let ids = [];
        _.map(selectedBrewry, (breweryItem, breweryIndex) => {
            ids.push(breweryItem.id);
        });
        if (ids.length > 0) {
            executeQuery({
                method: 'post',
                url: '/brewery/multihide',
                data: {
                    ids,
                },
                success: (res) => {
                    pushNotification(NOTIFICATION_TYPE_SUCCESS, '숨김 성공');
                },
                fail: (err, res) => {
                    const errMsg = _.get(err, 'data.error');
                    pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
                }
            })
        }
    };

    processShowBrewery = () => {
        const selectedBrewry = this.breweryTable.getCheckedItems();
        let ids = [];
        _.map(selectedBrewry, (breweryItem, breweryIndex) => {
            ids.push(breweryItem.id);
        });
        if (ids.length > 0) {
            executeQuery({
                method: 'post',
                url: '/brewery/multishow',
                data: {
                    ids,
                },
                success: (res) => {
                    pushNotification(NOTIFICATION_TYPE_SUCCESS, '해제 성공');
                },
                fail: (err, res) => {
                    const errMsg = _.get(err, 'data.error');
                    pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
                }
            })
        }
    };

    processDeleteBrewery = () => {
        const selectedBrewry = this.breweryTable.getCheckedItems();
        let ids = [];
        _.map(selectedBrewry, (breweryItem, breweryIndex) => {
            ids.push(breweryItem.id);
        });
        if (ids.length > 0) {
            executeQuery({
                method: 'post',
                url: '/brewery/multidel',
                data: {
                    ids,
                },
                success: (res) => {
                    const warnings = res.warnings || [];
                    if (warnings.length > 0) {
                        _.map(warnings, (warningItem, index) => {
                            pushNotification(NOTIFICATION_TYPE_WARNING, warningItem);
                        })
                    } else {
                        pushNotification(NOTIFICATION_TYPE_SUCCESS, '삭제가 완료되었습니다');
                    }
                    this.getBreweryData();
                },
                fail: (err, res) => {
                    const errMsg = _.get(err, 'data.error');
                    pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
                }
            })
        }
    };

    renderBreweryTable = () => {
        const {sFilterBreweryData} = this.state;
        return (
            <BreweryTable
                onRef={(ref) => {
                    this.breweryTable = ref
                }}
                pData={sFilterBreweryData}
                pColumns={[
                    {
                        type: TYPE_NO,
                        title: 'NO.'
                    },
                    {
                        name: 'image',
                        title: 'BreweryImage',
                        type: TYPE_IMG,
                    },
                    {
                        name: 'name',
                        title: '양조장 명',
                    },
                    {
                        name: 'content',
                        title: 'information',
                        type: TYPE_TEXT,
                    },
                    {
                        name: 'uid.userID',
                        title: '관리회원',
                        type: TYPE_TEXT,
                    },
                    {
                        name: '',
                        title: '상세보기',
                        type: TYPE_DETAIL,
                        clickFunc: this.handleClickBreweryTable
                    }
                ]}
                operation={{
                    multiCheck: true,
                }}
            />
        )
    };

    render() {
        const {sBreweryData, sFetchStatus, sIsMobileDimension, sIsShowUpdateModal, sModalMode, sUpdateId, sSearchWord} = this.state;

        if (sFetchStatus) {
            return (
                <div
                    className={sIsMobileDimension ? 'mobile-container-page-abroad-brewery' : 'container-page-abroad-brewery'}>
                    <div className='abroad-brewery-container'>
                        <div className='abroad-brewery'>
                            <div className='abroad-brewery-header'>
                                <div className='abroad-brewery-title'>해외 브루어리</div>
                                <div className='abroad-brewery-buttons'>
                                    <div className='abroad-brewery-operation-button'
                                         onClick={this.handleHideBrewery}>숨김
                                    </div>
                                    <div className='abroad-brewery-operation-button'
                                         onClick={this.handleShowBrewery}>해제
                                    </div>
                                    <div className='abroad-brewery-operation-button'
                                         onClick={this.handleCreateNewBrewery}>추가
                                    </div>
                                    <div className='abroad-brewery-operation-button'
                                         onClick={this.handleDeleteBrewery}>삭제
                                    </div>
                                </div>
                            </div>
                            {
                                sIsMobileDimension &&
                                <div className='abroad-brewery-inputer'>
                                    <SearchInputer
                                        isMobileDimension={sIsMobileDimension}
                                        pData={sBreweryData}
                                        pHandleSearch={this.handleSearchResult}
                                    />
                                </div>
                            }
                            <div className='abroad-brewery-table'>
                                {this.renderBreweryTable()}
                            </div>
                        </div>
                    </div>
                    {sIsShowUpdateModal &&
                    <UpdateModal
                        handleModalClose={this.handleModalShowChange}
                        pMode={sModalMode}
                        pId={sUpdateId}
                    />
                    }
                </div>
            );
        } else {
            return (
                <div className="loading-wrapper">
                    <Loading/>
                </div>
            );
        }
    }
}

AbroadBrewery.propTypes = {};

AbroadBrewery.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
            searchWord: state.search.searchWord
        }),
    )
)(AbroadBrewery);