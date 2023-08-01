import React, {Component} from 'react';
import _ from 'lodash';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';

import {executeQuery} from '../../../../library/utils/fetch';
import Loading from '../../../components/Loading';
import { params } from '../../../../params';
import {
    pushNotification,
    NOTIFICATION_TYPE_ERROR,
    NOTIFICATION_TYPE_SUCCESS
} from '../../../../library/utils/notification';
import { setCopyright } from '../../../../library/redux/actions/seach';

class License extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sFetchStatus: false,
            sBtnEnbaled: -1,
            sLicense: [],
            sPrivacy: [],
            sPersonal: [],
            sCopyright: [],
        };
        this.mode = [];
        this.stringInfo = [];
    }

    componentDidMount() {
        this.getLicenseInfo();
    }

    getLicenseInfo = () => {
        executeQuery({
            method: 'get',
            url: '/license/fetchall',
            success: (res) => {
                const result = _.get(res, 'docs') || [];
                if (result.length) {
                    // this.mode = true;
                }
                _.map(result, item => {
                    if (item.type === params.license) {
                        this.mode[item.type] = true;
                        this.setState({
                            sLicense: item.type === params.license && item,
                        })
                    } else if (item.type === params.privacy) {
                        this.mode[item.type] = true;
                        this.setState({
                            sPrivacy: item.type === params.privacy && item,
                        })
                    } else if (item.type === params.personal) {
                        this.mode[item.type] = true;
                        this.setState({
                            sPersonal: item.type === params.personal && item,
                        })
                    } else {
                        this.mode[item.type] = true;
                        this.setState({
                            sCopyright: item.type === params.copyright && item,
                        })
                    }
                });
                this.setState({
                    sFetchStatus: true,
                })
            },
            fail: (err) => {
                const errResult = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errResult);
            }
        })
    };

    handleChangedInputer = (e) => {
        const {name, value} = e.target;
        const license_type = ["license", "privacy", "personal", "copyright"];
        this.stringInfo[license_type.indexOf(name)] = value;
        this.setState({
            sBtnEnbaled: license_type.indexOf(name),
        })
    };

    handleEditLicense = (aType) => {
        const {sLicense, sPrivacy, sPersonal, sCopyright} = this.state;
        let licenseId ='';
        if (aType === params.license) licenseId = sLicense.id;
        if (aType === params.privacy) licenseId = sPrivacy.id;
        if (aType === params.personal) licenseId = sPersonal.id;
        if (aType === params.copyright) licenseId = sCopyright.id;
        if (this.mode[aType]) {
            executeQuery({
                method: 'put',
                url: `/license/updateone/${licenseId}`,
                data: {
                    content: this.stringInfo[aType] || '',
                    type: aType,
                },
                success: (res) => {
                    pushNotification(NOTIFICATION_TYPE_SUCCESS, '성공');
                    if(aType === params.copyright) {
                        this.props.setCopyright({copyright:this.stringInfo[aType]});
                    }
                    this.setState({
                        sBtnEnbaled: -1,
                    });

                },
                fail: (err) => {
                    const errResult = _.get(err, 'data.error');
                    if (errResult) {
                        pushNotification(NOTIFICATION_TYPE_ERROR, errResult);
                    }
                }
            })
        } else {
            executeQuery({
                method: 'post',
                url: `/license/create`,
                data: {
                    content: this.stringInfo[aType] || '',
                    type: aType,
                },
                success: (res) => {
                    pushNotification(NOTIFICATION_TYPE_SUCCESS, '성공');
                    this.mode[aType] = true;
                    if(aType === params.copyright) {
                        this.props.setCopyright({copyright:this.stringInfo[aType]});
                    }
                    this.setState({
                        sBtnEnbaled: -1,
                    })
                },
                fail: (err) => {
                    const errResult = _.get(err, 'data.error');
                    if (errResult) {
                        pushNotification(NOTIFICATION_TYPE_ERROR, errResult);
                    }
                }
            })
        }
    };

    render() {
        const {sFetchStatus, sLicense, sPrivacy, sBtnEnbaled, sPersonal, sCopyright} = this.state;
        if (sFetchStatus) {
            return (
                <div className='container-page-license'>
                    <div className="license-content">
                        <div className="using-license-content">
                            <span>이용약관</span>
                            <textarea
                                name="license"
                                defaultValue={sLicense.content}
                                onChange={this.handleChangedInputer}
                                className="using-license-inputer"></textarea>
                            <button
                                className="using-license-btn-enable"
                                disabled={sBtnEnbaled === params.license ? false : true}
                                onClick={this.handleEditLicense.bind(this, params.license)}>
                                저장
                            </button>
                        </div>
                        <div className="privacy-content">
                            <span>개인정보 수집 및 이용동의</span>
                            <textarea
                                name="privacy"
                                defaultValue={sPrivacy.content}
                                onChange={this.handleChangedInputer}
                                className="privacy-inputer"></textarea>
                            <button
                                className="privacy-btn-enable"
                                disabled={sBtnEnbaled === params.privacy ? false : true}
                                onClick={this.handleEditLicense.bind(this, params.privacy)}>
                                저장
                            </button>
                        </div>
                        <div className="privacy-content">
                            <span>개인정보 처리방침</span>
                            <textarea
                                name="personal"
                                defaultValue={sPersonal.content}
                                onChange={this.handleChangedInputer}
                                className="privacy-inputer"></textarea>
                            <button
                                className="privacy-btn-enable"
                                disabled={sBtnEnbaled === params.personal ? false : true}
                                onClick={this.handleEditLicense.bind(this, params.personal)}>
                                저장
                            </button>
                        </div>
                        <div className="privacy-content">
                            <span>Copyright</span>
                            <textarea
                                name="copyright"
                                defaultValue={sCopyright.content}
                                onChange={this.handleChangedInputer}
                                className="privacy-inputer"></textarea>
                            <button
                                className="privacy-btn-enable"
                                disabled={sBtnEnbaled === params.copyright ? false : true}
                                onClick={this.handleEditLicense.bind(this, params.copyright)}>
                                저장
                            </button>
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

License.propTypes = {};

License.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
        }),
        {
            setCopyright
        }
    )
)(License);