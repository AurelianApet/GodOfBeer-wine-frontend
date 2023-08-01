import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes            from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import MaskedInput from 'react-text-mask';

import APIForm, {
    TYPE_INPUT, TYPE_APISELECT,
    TYPE_MASK_INPUT, MODE_CREATE, MODE_READ, MODE_UPDATE,
    TITLE_NORMAL,
    ERROR_BORDER, TYPE_RADIO,
} from '../../../components/APIForm';
import _ from 'lodash';
import { Modal, ModalHeader, ModalBody} from '../../../components/Modal';
import FileUploadPublic from '../../../components/FileUploadPublic';
import {
    pushNotification,
    NOTIFICATION_TYPE_SUCCESS,
    NOTIFICATION_TYPE_ERROR
} from '../../../../library/utils/notification';
import { numberUnmask, maskNumber } from '../../../../library/utils/masks';
import {executeQuery} from "../../../../library/utils/fetch";

const UNIT_PRICE_TYPE_DRAFT = 1;
const UNIT_PRICE_TYPE_BOTTLE = 2;
const UNIT_PRICE_TYPE_CAN = 2;

class NewBeerEnroll extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sIsVisible: true,
            sUserId: null,
            sFormMode: MODE_READ,
            sUnitPrice: [],
            styles: [],
            sNewUnitPriceType: null,
            sUserImage: '',
            sUserImageFromFileUpload: '',
            dangdo: 1,
            sando: 1,
            badi: 1,
            tanin: 1,
            newStyle: '',
            wine: {
                name: '',
                country: '',
                alcohol: '',
                capacity: '',
                vintage: ''
            }
        };
        this.newUnitPrice = {};
        this.beerContent = '';
        this.apiformDataFetched = false;
    }

    componentDidMount() {
        const userId = _.get( this.props, 'user.id' ) || '';
        this.setState({
            sUserId: userId,
        });

        if (this.props.pId) {
            executeQuery({
                method: 'get',
                url: `/wine/fetchone?id=${this.props.pId}`,
                success: (res) => {
                    let result = res.beer;
                    const unitPrice = result.default_unitcost || [];
                    this.beerContent = result.content || '';
                    this.setState({
                        sUnitPrice: unitPrice,
                        sUserImage: result.image || '',
                        dangdo: result.dangdo,
                        sando: result.sando,
                        badi: result.badi,
                        tanin: result.tanin,
                        wine: {
                            name: result.name,
                            country: result.country,
                            alcohol: result.alcohol,
                            capacity: result.capacity,
                            vintage: result.vintage
                        },
                        styles: result.styles
                    });
                },
                fail: (errResp, err) => {
                    console.log('eee->', errResp, err);
                }
            });
        }
    }

    /**
     * handle functinos
     **/

    closeUpdateModal = (aState, e) => {
        if ( e ) {
            e.preventDefault();
        }
        this.setState({
            sIsVisible: false
        });
        this.props.handleModalClose( false, aState );
    };

    handleSubmitBtn = () => {
        // this.apiForm.handleSubmitForm();
        const { pMode, pId, user } = this.props;
        const { sIsVisible, sUserId, sUnitPrice, sUserImage, sUserImageFromFileUpload, dangdo, sando, badi, tanin, wine, styles } = this.state;

        let url = '/wine/create';
        if (pMode === MODE_UPDATE) {
            url = `/wine/updateone/${pId}`;
        }
        if (!wine.name) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '와인명을 입력해주세요');
            return;
        }
        if (!wine.country) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '나라명을 입력해주세요');
            return;
        }
        if (!wine.alcohol) {
            pushNotification(NOTIFICATION_TYPE_ERROR, 'ABV 입력해주세요');
            return;
        }
        if (!wine.capacity) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '용량을 입력해주세요');
            return;
        }
        if (!wine.vintage) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '빈티지를 입력해주세요');
            return;
        }
        executeQuery({
            method: pMode === MODE_UPDATE ? 'put' : 'post',
            url: url,
            data: {
                uid: sUserId || '',
                unitcost: sUnitPrice,
                content: this.beerContent,
                dangdo: dangdo,
                sando: sando,
                badi: badi,
                tanin: tanin,
                role_id: user.role_id,
                name: wine.name,
                styles: styles,
                country: wine.country,
                vintage: wine.vintage,
                alcohol: wine.alcohol,
                capacity: wine.capacity
            },
            success: (res) => {
                pushNotification(NOTIFICATION_TYPE_SUCCESS, '와인 저장에 성공했습니다');
                this.closeUpdateModal( true );
            },
            fail: (errResp, err) => {
                console.log('eee->', errResp, err);
            }
        });
    };

    handleChangeNewUnitPrice = ( e ) => {
        if ( !e ) return;
        const name = e.target.name;
        const value = e.target.value;
        _.set( this.newUnitPrice, name, value );
        if ( name === 'bottleType' ) {
            this.setState({
                sNewUnitPriceType: value === 'Draft'? UNIT_PRICE_TYPE_DRAFT : value === 'bottle' ? UNIT_PRICE_TYPE_BOTTLE : UNIT_PRICE_TYPE_CAN,
            });
        }
    };

    handleAddNewUnitPrice = () => {
        if ( this.newUnitPrice.bottleType && this.newUnitPrice.capacity && this.newUnitPrice.price ) {
            const { sUnitPrice } = this.state;
            this.newUnitPrice.price = numberUnmask( this.newUnitPrice.price );
            this.newUnitPrice.capacity = numberUnmask( this.newUnitPrice.capacity );
            sUnitPrice.push({
                ...this.newUnitPrice,
                capacityUnit: 'ml',
                priceUnit: '원',
            });
            this.setState({
                sUnitPrice,
                sNewUnitPriceType: null,
            }, () => {
                this.newUnitPrice = {};
            });
        }
    };

    handleRemoveUnitPrice = ( aIndex ) => {
        let { sUnitPrice } = this.state;
        sUnitPrice.splice( aIndex, 1 );
        this.setState({
            sUnitPrice,
        });
    };

    handleChangeBeerContent = ( e ) => {
        this.beerContent = e.target.value;
    };

    handleGetPhoto = ( aFiles ) => {
        const url = _.get( aFiles, '[0].url' ) || '';
        this.setState({
            sUserImageFromFileUpload: url,
            sUserImage: url,
        })
    };

    renderUserImage = ( funcHandleClick ) => {
        const { sUserImage, sUserImageFromFileUpload } = this.state;
        return (
            <img
                src={sUserImage || sUserImageFromFileUpload || '/assets/images/producer/user-profile-not-found.jpeg'}
                onError={(e) => {e.target.src = '/assets/images/producer/user-profile-not-found.jpeg'}}
                onClick={funcHandleClick}
                alt=''
            />
        );
    };

    renderUnitPrices = () => {
        const { sUnitPrice } = this.state;
        let resultHtml = [];
        _.map( sUnitPrice, ( priceItem, priceIndex ) => {
            resultHtml.push(
                <tr key={priceIndex}>
                    <td>{priceItem.bottleType}</td>
                    <td>{`${maskNumber( priceItem.capacity || '' )}${priceItem.capacityUnit || ''}`}</td>
                    <td>{`${maskNumber( priceItem.price || '' )}${priceItem.priceUnit || ''}`}</td>
                    <td><i className='fa fa-trash-o' onClick={this.handleRemoveUnitPrice.bind( this, priceIndex )} /></td>
                </tr>
            );
        });
        return resultHtml;
    };

    changeStyle(e, index) {
        let { styles } = this.state;
        styles[index] = e.target.value;
        this.setState({styles: styles});
    }

    removeStyle(index) {
        let { styles } = this.state;
        styles.splice(index, 1);
        this.setState({styles: styles});
    }

    renderStyles = () => {
        const { styles } = this.state;
        let resultHtml = [];
        _.map( styles, ( styleItem, styleIndex ) => {
            resultHtml.push(
                <div className={'row from-group'} key={styleIndex} style={{margin: 0, marginBottom: '10px'}}>
                    <input className={'form-control col-sm-10'} defaultValue={styleItem} onChange={(e) => this.changeStyle(e, styleIndex)} />
                    <div className={'col-sm-2'}>
                        <i className='fa fa-trash-o' onClick={() => {this.removeStyle(styleIndex)}} style={{lineHeight: '34px', fontSize: '25px'}}/>
                    </div>
                </div>
            );
        });
        return resultHtml;
    };

    renderNewUnitPrice = () => {
        const { sUnitPrice } = this.state;
        const capacityMask = createNumberMask({
            prefix: '',
            suffix: '',
            thousandsSeparatorSymbol: ',',
        });
        const priceMask = createNumberMask({
            prefix: '',
            suffix: '',
            thousandsSeparatorSymbol: ',',
        });
        return (
            <tr key={`addNewUnitPrice-${sUnitPrice.length}`}>
                <td>
                    <select
                        ref={(node => {this.newUnitPriceSelect = node})}
                        name='bottleType'
                        onChange={this.handleChangeNewUnitPrice}
                    >
                        <option value=''></option>
                        <option value='Draft'>Draft</option>
                        <option value={'Bottle'}>{'Bottle'}</option>
                        <option value={'Can'}>{'Can'}</option>
                    </select>
                </td>
                <td>
                    <MaskedInput
                        ref={(node => {this.newUnitPriceCapacityInput = node})}
                        name='capacity'
                        mask={capacityMask}
                        onChange={this.handleChangeNewUnitPrice}
                    />
                    ml
                </td>
                <td>
                    <MaskedInput
                        ref={(node => {this.newUnitPricePriceInput = node})}
                        name='price'
                        mask={priceMask}
                        onChange={this.handleChangeNewUnitPrice}
                    />
                    원
                </td>
                <td><div className='save-new-unit-price' onClick={this.handleAddNewUnitPrice}><i className='fa fa-save'/></div></td>
            </tr>
        );
    };

    addNewStyle() {
        const {newStyle} = this.state;
        if (newStyle) {
            let {styles} = this.state;
            styles.push(newStyle);
            this.setState({styles});
            this.setState({newStyle: ''});
        }
    }

    renderNewStyle() {
        const {newStyle} = this.state;

        return (
            <div className={'row form-group'} style={{margin: 0}}>
                <input className={'form-control col-sm-10'} value={newStyle} onChange={(e) => {this.setState({newStyle: e.target.value})}} />
                <div className={'col-sm-2'}>
                    <i className='fa fa-save' onClick={() => {this.addNewStyle()}} style={{lineHeight: '34px', fontSize: '25px'}}/>
                </div>
            </div>
        )
    }

    renderBeerUnitPriceInput = () => {
        return (
            <div className='beer-unit-price-input-container'>
                <table>
                    <thead>
                    <tr>
                        <th>구분</th>
                        <th>용량</th>
                        <th>공급가</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {this.renderUnitPrices()}
                    {this.renderNewUnitPrice()}
                    </tbody>
                </table>
            </div>
        )
    };

    renderBeerStyleInput = () => {
        return (
            <div>
                {this.renderStyles()}
                {this.renderNewStyle()}
            </div>
        )
    };

    setDango(val) {
        this.setState({dangdo: val});
    }

    setSando(val) {
        this.setState({sando: val})
    }

    setBadi(val) {
        this.setState({badi: val})
    }

    setTanin(val) {
        this.setState({tanin: val})
    }

    handleInfoChange(e) {
        let {wine} = this.state;
        wine[e.target.name] = e.target.value;
        this.setState({wine});
    }

    render() {
        const { pMode, pId, user } = this.props;
        const { sIsVisible, sUserId, sUnitPrice, sUserImage, sUserImageFromFileUpload, dangdo, sando, badi, tanin, wine } = this.state;
        const decimalMask = createNumberMask({
            prefix: '',
            allowDecimal: true,
            decimalLimit: 1,
            includeThousandsSeparator: false,
        });

        return (
            <div>
                <Modal
                    toggle={this.closeUpdateModal}
                    isOpen={sIsVisible}
                    className='new-wine-modal'
                >
                    <ModalHeader className='modal-header' toggle={this.closeUpdateModal} style={{justifyContent: 'flex-start'}}>
                        <div className = 'modal-title'>{pMode === MODE_CREATE? '와인추가' : '와인정보' }</div>
                    </ModalHeader>
                    <ModalBody className='modal-body'>
                        <div className='row form-group'>
                            <label className="control-label col-sm-2">와인명</label>
                            <input className='form-control col-sm-10' name='name' defaultValue={wine.name} onChange={(e) => {this.handleInfoChange(e)}}/>
                        </div>
                        <div className='row form-group'>
                            <label className="control-label col-sm-2">나라</label>
                            <input className='form-control col-sm-4' name='country' defaultValue={wine.country}  onChange={(e) => {this.handleInfoChange(e)}}/>
                            <label className="control-label col-sm-2">용량</label>
                            <input className='form-control col-sm-4' name='capacity' defaultValue={wine.capacity}  onChange={(e) => {this.handleInfoChange(e)}}/>
                        </div>
                        <div className='row form-group'>
                            <label className="control-label col-sm-2">ABV</label>
                            <input className='form-control col-sm-4' name='alcohol' defaultValue={wine.alcohol}  onChange={(e) => {this.handleInfoChange(e)}}/>
                            <label className="control-label col-sm-2">빈티지</label>
                            <input className='form-control col-sm-4' name='vintage' defaultValue={wine.vintage}  onChange={(e) => {this.handleInfoChange(e)}}/>
                        </div>
                        <div className='row form-group'>
                            <label className="control-label col-sm-12">품종</label>
                        </div>
                        {this.renderBeerStyleInput()}

                        <div className='beer-extra-info'>
                            <div className='beer-unit-price-content'>
                                <div className='beer-unit-price-content-header'>와인소개</div>
                                <textarea
                                    defaultValue={this.beerContent}
                                    onChange={this.handleChangeBeerContent}
                                />
                            </div>
                        </div>

                        <div className='beer-extra-info'>
                            <div className='beer-unit-price-input'>
                                <div className='beer-unit-price-input-header'>Tasting Note</div>
                                <table className={'tasting-note-table'}>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>1</th>
                                            <th>2</th>
                                            <th>3</th>
                                            <th>4</th>
                                            <th>5</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>당도</td>
                                            <td>
                                                <i className={dangdo === 1 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setDango.bind( this, 1 )}/>
                                            </td>
                                            <td>
                                                <i className={dangdo === 2 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setDango.bind( this, 2 )}/>
                                            </td>
                                            <td>
                                                <i className={dangdo === 3 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setDango.bind( this, 3 )}/>
                                            </td>
                                            <td>
                                                <i className={dangdo === 4 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setDango.bind( this, 4 )}/>
                                            </td>
                                            <td>
                                                <i className={dangdo === 5 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setDango.bind( this, 5 )}/>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>산도</td>
                                            <td>
                                                <i className={sando === 1 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setSando.bind( this, 1 )}/>
                                            </td>
                                            <td>
                                                <i className={sando === 2 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setSando.bind( this, 2 )}/>
                                            </td>
                                            <td>
                                                <i className={sando === 3 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setSando.bind( this, 3 )}/>
                                            </td>
                                            <td>
                                                <i className={sando === 4 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setSando.bind( this, 4 )}/>
                                            </td>
                                            <td>
                                                <i className={sando === 5 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setSando.bind( this, 5 )}/>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>바디</td>
                                            <td>
                                                <i className={badi === 1 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setBadi.bind( this, 1 )}/>
                                            </td>
                                            <td>
                                                <i className={badi === 2 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setBadi.bind( this, 2 )}/>
                                            </td>
                                            <td>
                                                <i className={badi === 3 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setBadi.bind( this, 3 )}/>
                                            </td>
                                            <td>
                                                <i className={badi === 4 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setBadi.bind( this, 4 )}/>
                                            </td>
                                            <td>
                                                <i className={badi === 5 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setBadi.bind( this, 5 )}/>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>타닌</td>
                                            <td>
                                                <i className={tanin === 1 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setTanin.bind( this, 1 )}/>
                                            </td>
                                            <td>
                                                <i className={tanin === 2 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setTanin.bind( this, 2 )}/>
                                            </td>
                                            <td>
                                                <i className={tanin === 3 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setTanin.bind( this, 3 )}/>
                                            </td>
                                            <td>
                                                <i className={tanin === 4 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setTanin.bind( this, 4 )}/>
                                            </td>
                                            <td>
                                                <i className={tanin === 5 ? 'fa fa-dot-circle-o' : 'fa fa-circle-o'} onClick={this.setTanin.bind( this, 5 )}/>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className = 'new-beer-button-group' >
                            <button className = 'simple-button' onClick = {this.handleSubmitBtn}>저장</button>
                            <button className = 'simple-button' onClick = {this.closeUpdateModal}>취소</button>
                        </div>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}

NewBeerEnroll.propTypes = {
    handleModalClose: PropTypes.func,
    pMode: PropTypes.number,
    pId: PropTypes.string
};

NewBeerEnroll.defaultProps = {
    handleModalClose: () => {},
    pMode: MODE_READ,
    pId: ''
};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
        }),
    )
)(NewBeerEnroll);
