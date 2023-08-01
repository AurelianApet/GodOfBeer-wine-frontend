import React, {Component} from 'react';
import _ from 'lodash';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import MaskedInput from 'react-text-mask';

import {Modal, ModalHeader, ModalBody} from '../../../components/Modal';
import Loading from '../../../components/Loading';
import FileUpload from '../../../components/Form/FileUpload';
import SearchSelect from '../../../components/SearchSelect';
import FileList from '../../../components/Form/FileList';

import {executeQuery} from '../../../../library/utils/fetch';
import {findFromArray} from '../../../../library/utils/array';
import {
    pushNotification,
    NOTIFICATION_TYPE_WARNING,
    NOTIFICATION_TYPE_ERROR,
    NOTIFICATION_TYPE_SUCCESS
} from '../../../../library/utils/notification';
import {maskNumber, numberUnmask} from '../../../../library/utils/masks';
import {copyObject} from '../../../../library/utils/objects';

import {appConfig} from '../../../../appConfig';
import {confirmAlertMsg} from '../../../../library/utils/confirmAlert';
import cn from 'classnames';
import {generateRandomString} from "../../../../library/utils/helper";

const ORDER_MASK = createNumberMask({
    prefix: '',
    suffix: '',
    thousandsSeparatorSymbol: '',
});
const PRICE_MASK = createNumberMask({
    prefix: '',
    suffix: '',
    allowNegative: true,
    thousandsSeparatorSymbol: ',',
});

class SellerMenu extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sMainMenu: [],
            sOtherMenu: [],
            // sWineCategoryList: [],
            // sFoodCategoryList: [],
            tempOtherMenu: [],
            tempMainMenu: [],
            sBeersByBottleType: {},
            sFetchStatus: {},
            sIsHiddenMainMenu: {},
            sIsHiddenFoodMenu: {},
            tempHiddenFoodMenu: {},
            tempHiddenMainMenu: {},
            sIsVisibleBeerMenuModal: false,
            sIsVisibleEditCategoryModal: false,
            sIsVisibleEditMainCategoryModal: false,
            sSelectedCapacity: [],
            sIsShowNewFoodKind: false,
            sBeerMenuMode: -1,
            sFoodMenuMode: 0
        };
        this.beers = {};
        this.mainMenuOrder = {};
        this.otherMenuOrder = {};
        this.pubId = '';
        this.modified = false;
    }

    componentDidMount = () => {
        this.getBeerData();
        this.getPubInfo();
    };

    getBeerData = () => {
        executeQuery({
            method: 'get',
            url: '/wine/fetchall?uid=' + this.props.userId,
            success: (res) => {
                let {sFetchStatus} = this.state;
                const result = res.beer || [];
                this.totalBeers = result;
                sFetchStatus.beer = true;
                this.setState({
                    sFetchStatus
                });
            },
            fail: (err, res) => {
            }
        });
    };

    getPubInfo = () => {
        const {userId, userKind} = this.props;
        if (userId) {
            executeQuery({
                method: 'get',
                url: `/pub/fetchone?${userKind}=${userId}`,
                success: (res) => {
                    let {sFetchStatus} = this.state;
                    const result = _.get(res, 'pub') || {};
                    this.pubId = result.id;
                    const mainMenu = result.mainMenu || [];
                    const otherMenu = result.otherMenu || [];
                    const otherMenuHidden = result.otherMenu_hidden || [];
                    // const wineCategoryList = result.wineCategoryList || [];
                    // const foodCategoryList = result.foodCategoryList || [];
                    let mainMenuGrouped = {};
                    let otherMenuGrouped = {};
                    let sBeerMenuMode = -1;
                    _.map(mainMenu, (menuItem, menuIndex) => {
                        const crrKind = menuItem.kind || '';
                        if (crrKind) {
                            let crrGroupedMenu = mainMenuGrouped[crrKind] || [];
                            crrGroupedMenu.push(menuItem);
                            mainMenuGrouped[crrKind] = crrGroupedMenu;
                            this.mainMenuOrder[crrKind] = {};
                            this.mainMenuOrder[crrKind]["sort_order"] = menuItem.sort_order;
                            this.mainMenuOrder[crrKind]["category_id"] = menuItem.category_id;
                        }
                    });
                    let isHiddenFoodMenu = {};
                    _.map(otherMenu, (menuItem, menuIndex) => {
                        const crrKind = menuItem.kind || '';
                        if (crrKind) {
                            let crrGroupedMenu = otherMenuGrouped[crrKind] || [];
                            crrGroupedMenu.push(menuItem);
                            otherMenuGrouped[crrKind] = crrGroupedMenu;
                            this.otherMenuOrder[crrKind] = {};
                            this.otherMenuOrder[crrKind]["sort_order"] = menuItem.sort_order;
                            this.otherMenuOrder[crrKind]["category_id"] = menuItem.category_id;
                            isHiddenFoodMenu[crrKind] = otherMenuHidden[menuIndex] || false;
                        }
                    });

                    sFetchStatus.pub = true;
                    this.setState({
                        sFetchStatus,
                        sBeerMenuMode: Object.keys(mainMenuGrouped).length > 0 ? 0 : -1,
                        sMainMenu: mainMenuGrouped,
                        sOtherMenu: otherMenuGrouped,
                        sIsHiddenFoodMenu: isHiddenFoodMenu,
                        // sWineCategoryList: wineCategoryList,
                        // sFoodCategoryList: foodCategoryList
                    });
                },
                fail: (err, res) => {
                }
            })
        } else {
            setTimeout(() => {
                this.getPubInfo();
            }, 100);
        }
    };

    handleRemoveAllMenus = (aType) => {
        const {location: {pathname}} = this.props;
        let confirmParam = {
            title: '분류삭제',
            detail: '이 분류를 삭제하시겠습니까?',
            confirmTitle: '예',
            noTitle: '아니',
            confirmFunc: this.processRemoveAllMenus.bind(null, aType),
        };
        confirmAlertMsg(confirmParam, pathname);

    };

    handleRemoveAllFoodMenus = (aType) => {
        let {tempOtherMenu} = this.state;
        let newOtherMenu = {};
        _.map(tempOtherMenu, (menuItem, menuIndex) => {
            if (menuIndex !== aType) {
                newOtherMenu[menuIndex] = menuItem;
            }
        });
        this.setState({
            tempOtherMenu: newOtherMenu,
        });
    };

    handleRemoveAllMainMenus = (aType) => {
        let {tempMainMenu} = this.state;
        let newOtherMenu = {};
        _.map(tempMainMenu, (menuItem, menuIndex) => {
            if (menuIndex !== aType) {
                newOtherMenu[menuIndex] = menuItem;
            }
        });
        this.setState({
            tempMainMenu: newOtherMenu,
        });
    };

    handleAddNewBeerMenuItem = () => {
        const {sMainMenu, sBeerMenuMode} = this.state;
        if (sBeerMenuMode === -1) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '분류를 선택해주세요.');
            return;
        }
        const sortedMenu = _.sortBy(sMainMenu, [function (menuItem) {
            return _.get(menuItem, '[0].sort_order') || 0;
        }]);
        let aType = '';
        for (let i = 0; i < sortedMenu.length; i ++) {
            const kind = _.get(sortedMenu[i], '[0].kind') || '';
            if (i === sBeerMenuMode) {
                aType = kind;
            }
        }
        this.editBeerMenuItem = {type: aType, item: null, index: null, no: 1};
        this.handleToggleBeerMenuModal(true);
    };

    handleAddNewFoodMenuItem = () => {
        const {sOtherMenu, sFoodMenuMode} = this.state;
        const sortedMenu = _.sortBy(sOtherMenu, [function (menuItem) {
            return _.get(menuItem, '[0].sort_order') || 0;
        }]);
        let aType = '';
        for (let i = 0; i < sortedMenu.length; i ++) {
            const kind = _.get(sortedMenu[i], '[0].kind') || '';
            if (i === sFoodMenuMode) {
                aType = kind;
            }
        }
        this.editFoodMenuItem = {type: aType, item: null, index: null, no: 1};
        this.handleToggleFoodMenuModal(true);
    };

    handleEditMenuItem = (aType, aItem, aIndex) => {
        this.editBeerMenuItem = {type: aType, item: copyObject(aItem), index: aIndex};
        this.handleToggleBeerMenuModal(true, {sSelectedCapacity: this.beers[_.get(aItem, 'id') || ''] || [],})
    };

    handleEditCategory = (aType, menuIndex) => {
        this.editFoodMenuCategory = {type: aType, index: menuIndex, oldType: aType};
        this.handleToggleEditCategoryModal(true, {})
    };

    handleEditFoodMenuItem = (aType, aItem, aIndex) => {
        this.editFoodMenuItem = {type: aType, item: copyObject(aItem), index: aIndex};
        this.handleToggleFoodMenuModal(true);
    };

    handleToggleBeerMenuModal = (aState, aAdditionalState) => {
        if (!aState) {
            this.editBeerMenuItem = null;
        }
        const additionalState = aAdditionalState || {};
        this.setState({
            sIsVisibleBeerMenuModal: aState,
            sSelectedCapacity: [],
            ...additionalState,
        })
    };

    handleToggleEditCategoryModal = (aState, aAdditionalState) => {
        if (!aState) {
            this.editFoodMenuCategory = null;
        }
        const additionalState = aAdditionalState || {};
        this.setState({
            sIsVisibleEditCategoryModal: aState,
            ...additionalState,
        })
    };

    handleToggleEditMainCategoryModal = (aState, aAdditionalState) => {
        const additionalState = aAdditionalState || {};
        this.setState({
            sIsVisibleEditMainCategoryModal: aState,
            ...additionalState,
        })
    };

    handleToggleFoodMenuModal = (aState, aAdditionalState) => {
        if (!aState) {
            this.editFoodMenuItem = null;
        }
        const additionalState = aAdditionalState || {};
        this.setState({
            sIsVisibleFoodMenuModal: aState,
            ...additionalState,
        })
    };

    handleRemoveMenuItem = (aType, aIndex) => {
        console.log(arguments);
        let {sMainMenu} = this.state;
        let targetMenu = sMainMenu[aType] || [];
        targetMenu.splice(aIndex, 1);
        if(targetMenu.length) {
            sMainMenu[aType] = targetMenu;
        }
        else {
            delete sMainMenu[aType];
        }
        this.setState({
            sMainMenu,
        })
    };

    handleRemoveFoodMenuItem = (aType, aIndex) => {
        let {sOtherMenu} = this.state;
        let targetMenu = sOtherMenu[aType] || [];
        targetMenu.splice(aIndex, 1);
        if(targetMenu.length) {
            sOtherMenu[aType] = targetMenu;
        }
        else {
            delete sOtherMenu[aType];
        }
        this.setState({
            sOtherMenu,
        })
    };

    handleRemoveModalImage = () => {
        _.set(this.editFoodMenuItem, 'item.image', '');
    };

    handleChangeBeerMenuItem = (e) => {
        if (!e) return;
        const {value, name} = e.target;
        if (name === 'price') {
            _.set(this.editBeerMenuItem, 'item.priceUnit', '원');
            _.set(this.editBeerMenuItem, 'item.price', numberUnmask(`${value}`));
        } else {
            _.set(this.editBeerMenuItem, `item.${name}`, value);
        }
    };

    handleChangeFoodMenuItem = (e) => {
        if (!e) return;
        const {value, name} = e.target;
        _.set(this.editFoodMenuItem, `item.${name}`, value);
    };

    handleChangeCategory = (e, kind) => {
        if (!e) return;
        console.log('change cateogry1');
        const {value} = e.target;
        let {tempOtherMenu} = this.state;
        tempOtherMenu[kind][0].kind = value;
        this.setState({tempOtherMenu: tempOtherMenu});
    };

    handleChangeMainCategory = (e, kind) => {
        if (!e) return;
        console.log('change main category1');
        const {value} = e.target;
        let {tempMainMenu} = this.state;
        tempMainMenu[kind][0].kind = value;
        this.setState({tempMainMenu: tempMainMenu});
    };

    handleChangeFoodMenuItemSoldOut = (aType, aIndex) => {
        let {sOtherMenu} = this.state;
        const crrSoldOut = _.get(sOtherMenu, `${aType}[${aIndex}].is_soldout`);
        _.set(sOtherMenu, `${aType}[${aIndex}].is_soldout`, !crrSoldOut);
        this.setState({
            sOtherMenu,
        })
    };

    handleSelectBeerItem = (aItem) => {
        _.set(this.editBeerMenuItem, 'item', aItem);
        this.editBeerMenuItem.item.menu_name = _.get(this.editBeerMenuItem, 'item.name') || '';
        this.setState({
            sSelectedCapacity: this.beers[aItem.id || ''] || [],
        });
    };

    handleSelectBeerCapacity = (aItem) => {
        _.set(this.editBeerMenuItem, 'item.capacity', aItem.capacity);
        _.set(this.editBeerMenuItem, 'item.capacityUnit', aItem.capacityUnit);
    };

    handleAddNewFoodKind = () => {
        const {sOtherMenu, sIsHiddenFoodMenu} = this.state;
        this.setState({
            sIsVisibleEditCategoryModal: true,
            tempOtherMenu: sOtherMenu,
            tempHiddenFoodMenu: sIsHiddenFoodMenu
        });
    };

    handleAddNewMainKind = () => {
        const {sMainMenu, sIsHiddenMainMenu} = this.state;
        this.setState({
            sIsVisibleEditMainCategoryModal: true,
            tempMainMenu: sMainMenu,
            tempHiddenMainMenu: sIsHiddenMainMenu
        });
    };

    handleChangeNewFoodKind = (e) => {
        if (!e) return;
        this.newFoodKind = e.target.value;
    };

    handleSaveNewFoodKind = () => {
        let {tempOtherMenu, tempHiddenFoodMenu} = this.state;
        let temp = {...tempOtherMenu};
        let key = 'temp-' + generateRandomString(5);
        temp[key] = [{
            kind: '',
            no: 1,
            isNew: true,
            sort_order: 1,
        }];
        this.otherMenuOrder[key] = {};
        this.otherMenuOrder[key]["sort_order"] = 1;
        this.otherMenuOrder[key]["category_id"] = 0;
        tempHiddenFoodMenu[key] = false;
        this.setState({
            tempOtherMenu: temp,
            tempHiddenFoodMenu: tempHiddenFoodMenu
        });
    };

    handleSaveNewMainKind = () => {
        let {tempMainMenu, tempHiddenMainMenu} = this.state;
        let temp = {...tempMainMenu};
        let key = 'temp-' + generateRandomString(5);
        temp[key] = [{
            kind: '',
            no: 1,
            isNew: true,
            sort_order: 1,
        }];
        this.mainMenuOrder[key] = {};
        this.mainMenuOrder[key]["sort_order"] = 1;
        this.mainMenuOrder[key]["category_id"] = 0;
        tempHiddenMainMenu[key] = false;
        this.setState({
            tempMainMenu: temp,
            tempHiddenMainMenu: tempHiddenMainMenu
        });
    };

    handleCancelNewFoodKind = () => {
        this.newFoodKind = '';
        this.setState({
            sIsShowNewFoodKind: false,
        })
    };

    handleChangeMenuOrder = (aType, kind, e) => {
        if (!e) return;
        if(kind === 0) {
            this.mainMenuOrder[aType]["sort_order"] = e.target.value * 1;
        }
        else {
            this.otherMenuOrder[aType]["sort_order"] = e.target.value * 1;
        }
    };

    handleSaveBeerMenuItem = () => {
        let image = _.get(this.editBeerMenuItem, 'item.image') || '';
        if (typeof image === 'object' && Object.keys(image).length === 0) {
            image = '';
        }
        if (image) {
            this.handleUploadBeerDone([]);
        } else {
            this.fileUpload.processSubmit();
        }
    };

    handleUploadBeerDone = (uploadedFiles) => {
        let target = this.editBeerMenuItem.item || {};
        if (!target.menu_name) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '메뉴명을 입력해주세요.');
            return;
        }
        if (!target.price) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '가격을 입력해주세요.');
            return;
        }
        if (!_.get(target, 'id')) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '와인을 선택해주세요.');
            return;
        }
        if (!target.capacity) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '용량을 선택해주세요.');
            return;
        }
        if (uploadedFiles.length > 0) {
            const basicUrl = appConfig.apiUrl.substr(0, appConfig.apiUrl.lastIndexOf('/') + 1);
            const fileItem = uploadedFiles[0];
            const fileName = fileItem.name || '';
            const fileType = fileName.substr(fileName.lastIndexOf('.') + 1, fileName.length);
            const url = basicUrl + fileItem.id + '.' + fileType;
            _.set(this.editBeerMenuItem, 'item.image', url);
        }
        else {
            _.set(this.editBeerMenuItem, 'item.image', '');
        }
        const price = _.get(this.editBeerMenuItem, 'item.price') || '';
        _.set(this.editBeerMenuItem, 'item.price', numberUnmask(`${price}`));
        const priceUnit = _.get(this.editBeerMenuItem, 'item.priceUnit') || '원';
        _.set(this.editBeerMenuItem, 'item.priceUnit', priceUnit);
        const capacityUnit = _.get(this.editBeerMenuItem, 'item.capacityUnit') || 'ml';
        _.set(this.editBeerMenuItem, 'item.capacityUnit', capacityUnit);
        const capacity = _.get(this.editBeerMenuItem, 'item.capacity') || '';
        _.set(this.editBeerMenuItem, 'item.capacity', numberUnmask(`${capacity}`));
        const index = _.get(this.editBeerMenuItem, 'index');
        const type = _.get(this.editBeerMenuItem, 'type') || '';
        let {sMainMenu} = this.state;
        let targetArray = sMainMenu[type] || [];
        target.sort_order = this.mainMenuOrder[type]["sort_order"];
        if (targetArray[0] && targetArray[0].isNew) targetArray.splice(0, 1);
        target.kind = type;
        if (index || index === 0) {
            _.set(targetArray, `[${index}]`, target);
        } else {
            target.added = true;
            targetArray.push(target);
        }
        sMainMenu[type] = targetArray;
        this.handleToggleBeerMenuModal(false, {sMainMenu})
    };

    handleSaveCategory = () => {
        let {tempOtherMenu, tempHiddenFoodMenu} = this.state;
        let keys = Object.keys(tempOtherMenu);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].indexOf('temp-') >= 0) {
                if (tempOtherMenu[keys[i]][0].kind.trim() === '') {
                    delete tempOtherMenu[keys[i]];
                    delete tempHiddenFoodMenu[keys[i]];
                } else {
                    let duplicatedKind = false;
                    _.map(tempOtherMenu, (menuItem, menuKind) => {
                        if (tempOtherMenu[keys[i]][0].kind.trim() === menuKind) {
                            duplicatedKind = true;
                        }
                    });
                    if (duplicatedKind) {
                        pushNotification(NOTIFICATION_TYPE_WARNING, '중복되는 분류가 있습니다. 확인해주세요.');
                        return;
                    }

                    let type = tempOtherMenu[keys[i]][0].kind;
                    let item = tempOtherMenu[keys[i]];
                    for (let j = 0; j < item.length; j++) {
                        item[j].kind = type;
                        item[j].sort_order = this.otherMenuOrder[keys[i]]["sort_order"];
                    }
                    tempOtherMenu[type] = item;
                    this.otherMenuOrder[type] = {};
                    this.otherMenuOrder[type]["sort_order"] = this.otherMenuOrder[keys[i]]["sort_order"];
                    this.otherMenuOrder[type]["category_id"] = this.otherMenuOrder[keys[i]]["category_id"] ? this.otherMenuOrder[keys[i]]["category_id"] : 0;
                    delete tempOtherMenu[keys[i]];
                    delete this.otherMenuOrder[keys[i]];
                }
            } else {
                for(let j = 0 ; j < tempOtherMenu[keys[i]].length ; j ++) {
                    tempOtherMenu[keys[i]][j].sort_order = this.otherMenuOrder[keys[i]]["sort_order"];
                }
                if (keys[i] !== tempOtherMenu[keys[i]][0].kind) {
                    let type = tempOtherMenu[keys[i]][0].kind;
                    let item = tempOtherMenu[keys[i]];
                    for (let j = 0; j < item.length; j++) {
                        item[j].kind = type;
                    }
                    tempOtherMenu[type] = item;
                    this.otherMenuOrder[type] = {};
                    this.otherMenuOrder[type]["sort_order"] = this.otherMenuOrder[keys[i]]["sort_order"];
                    this.otherMenuOrder[type]["category_id"] = this.otherMenuOrder[keys[i]]["category_id"] ? this.otherMenuOrder[keys[i]]["category_id"] : 0;
                    delete tempOtherMenu[keys[i]];
                    delete this.otherMenuOrder[keys[i]];
                }
            }
        }

        this.setState({
            sOtherMenu: tempOtherMenu,
            sIsHiddenFoodMenu: tempHiddenFoodMenu
        });
        this.handleToggleEditCategoryModal(false);
    };

    handleSaveMainCategory = () => {
        let {tempMainMenu, tempHiddenMainMenu} = this.state;
        let keys = Object.keys(tempMainMenu);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].indexOf('temp-') >= 0) {
                if (tempMainMenu[keys[i]][0].kind.trim() === '') {
                    delete tempMainMenu[keys[i]];
                    delete tempMainMenu[keys[i]];
                } else {
                    let duplicatedKind = false;
                    _.map(tempMainMenu, (menuItem, menuKind) => {
                        if (tempMainMenu[keys[i]][0].kind.trim() === menuKind) {
                            duplicatedKind = true;
                        }
                    });
                    if (duplicatedKind) {
                        pushNotification(NOTIFICATION_TYPE_WARNING, '중복되는 분류가 있습니다. 확인해주세요.');
                        return;
                    }

                    let type = tempMainMenu[keys[i]][0].kind;
                    let item = tempMainMenu[keys[i]];
                    for (let j = 0; j < item.length; j++) {
                        item[j].kind = type;
                        item[j].sort_order = this.mainMenuOrder[keys[i]]["sort_order"];
                    }
                    tempMainMenu[type] = item;
                    this.mainMenuOrder[type] = {};
                    this.mainMenuOrder[type]["sort_order"] = this.mainMenuOrder[keys[i]]["sort_order"];
                    this.mainMenuOrder[type]["category_id"] = this.mainMenuOrder[keys[i]]["category_id"]
                    delete tempMainMenu[keys[i]];
                    delete this.mainMenuOrder[keys[i]];
                }
            } else {
                for(let j = 0 ; j < tempMainMenu[keys[i]].length ; j ++) {
                    tempMainMenu[keys[i]][j].sort_order = this.mainMenuOrder[keys[i]]["sort_order"];
                }
                if (keys[i] !== tempMainMenu[keys[i]][0].kind) {
                    let type = tempMainMenu[keys[i]][0].kind;
                    let item = tempMainMenu[keys[i]];
                    for (let j = 0; j < item.length; j++) {
                        item[j].kind = type;
                    }
                    tempMainMenu[type] = item;
                    this.mainMenuOrder[type] = {};
                    this.mainMenuOrder[type]["sort_order"] = this.mainMenuOrder[keys[i]]["sort_order"];
                    this.mainMenuOrder[type]["category_id"] = this.mainMenuOrder[keys[i]]["category_id"]
                    delete tempMainMenu[keys[i]];
                    delete this.mainMenuOrder[keys[i]];
                }
            }
        }

        this.setState({
            sMainMenu: tempMainMenu,
            sIsHiddenMainMenu: tempHiddenMainMenu
        });
        this.handleToggleEditMainCategoryModal(false);
    };

    handleUploadDone = (uploadedFiles) => {
        let target = this.editFoodMenuItem.item || {};
        if (typeof target.content === 'object') {
            target.content = '';
        }
        if (!target.name) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '메뉴명을 입력해주세요.');
            return;
        }
        if (!target.price) {
            pushNotification(NOTIFICATION_TYPE_ERROR, '가격을 입력해주세요..');
            return;
        }
        if (uploadedFiles.length > 0) {
            const basicUrl = appConfig.apiUrl.substr(0, appConfig.apiUrl.lastIndexOf('/') + 1);
            const fileItem = uploadedFiles[0];
            const fileName = fileItem.name || '';
            const fileType = fileName.substr(fileName.lastIndexOf('.') + 1, fileName.length);
            const url = basicUrl + fileItem.id + '.' + fileType;
            _.set(this.editFoodMenuItem, 'item.image', url);
        }
        else {
            _.set(this.editFoodMenuItem, 'item.image', '');
        }
        const price = _.get(this.editFoodMenuItem, 'item.price') || '';
        _.set(this.editFoodMenuItem, 'item.price', numberUnmask(`${price}`));
        const priceUnit = _.get(this.editFoodMenuItem, 'item.priceUnit') || '원';
        _.set(this.editFoodMenuItem, 'item.priceUnit', priceUnit);
        const index = _.get(this.editFoodMenuItem, 'index');
        const type = _.get(this.editFoodMenuItem, 'type') || '';
        const no = _.get(this.editFoodMenuItem, 'id') || 1;
        target.kind = type;
        target.no = no;
        target.sort_order = this.otherMenuOrder[type]["sort_order"];
        const {sOtherMenu} = this.state;
        let modifiedOtherMenu = {...sOtherMenu};
        let targetArray = modifiedOtherMenu[type] || [];

        if (_.get(targetArray, '[0].isNew')) {
            targetArray.splice(0, 1);
        }

        if (index || index === 0) {
            _.set(targetArray, `[${index}]`, target);
        } else {
            target.added = true;
            targetArray.push(target);
        }
        modifiedOtherMenu[type] = targetArray;
        this.handleToggleFoodMenuModal(false, {sOtherMenu: modifiedOtherMenu,})
    };

    handleToggleIsHiddenFoodMenu = (aFoodKind) => {
        let {tempHiddenFoodMenu} = this.state;
        const crrState = tempHiddenFoodMenu[aFoodKind] || false;
        _.set(tempHiddenFoodMenu, aFoodKind, !crrState);
        this.setState({
            tempHiddenFoodMenu,
        })
    };

    handleToggleIsHiddenMainMenu = (aFoodKind) => {
        let {tempHiddenMainMenu} = this.state;
        const crrState = tempHiddenMainMenu[aFoodKind] || false;
        _.set(tempHiddenMainMenu, aFoodKind, !crrState);
        this.setState({
            tempHiddenMainMenu,
        })
    };

    handleToggleIsHiddenMainMenu = (aFoodKind) => {
        let {tempHiddenMainMenu} = this.state;
        const crrState = tempHiddenMainMenu[aFoodKind] || false;
        _.set(tempHiddenMainMenu, aFoodKind, !crrState);
        this.setState({
            tempHiddenMainMenu,
        })
    };

    handleSaveFoodMenuItem = () => {
        let image = _.get(this.editFoodMenuItem, 'item.image') || '';
        if (typeof image === 'object' && Object.keys(image).length === 0) {
            image = '';
        }
        if (image) {
            this.handleUploadDone([]);
        } else {
            this.fileUpload.processSubmit();
        }
    };


    handleSaveSellerMenu = () => {
        const {sMainMenu, sOtherMenu, sIsHiddenFoodMenu, sIsHiddenMainMenu} = this.state;
        let mainMenu = [];
        let otherMenu = [];
        let mainCategoryList = this.mainMenuOrder;
        let otherCategoryList = this.otherMenuOrder;
        let orders = [];
        // let orderDuplicated = false;
        _.map(sMainMenu, (menuItem, menuIndex) => {
            // const order = this.menuOrder[menuIndex] || 1;
            // if (!findFromArray(orders, '', order)) {
            //     orders.push(order);
            // } else {
            //     orderDuplicated = true;
            // }
            _.map(menuItem, (item, index) => {
                console.log('item:', item);
                mainMenu.push({
                    kind: menuIndex,
                    menu_name: item.menu_name || '',
                    price: item.price || 0,
                    priceUnit: item.priceUnit,
                    name: item.name,
                    sort_order: item.sort_order || 1,
                    capacity: item.capacity,
                    capacityUnit: item.capacityUnit || "mL",
                    category_id: item.category_id,
                    is_soldout: item.is_soldout || false,
                    image: item.image || '',
                    isHidden: sIsHiddenMainMenu[menuIndex],
                    id: item.sid || '',
                    product_id: item.product_id || '',
                    added : item.added || false,
                });
            });
        });

        _.map(sOtherMenu, (menuItem, menuIndex) => {
            // const order = this.menuOrder[menuIndex] || 1;
            // if (!findFromArray(orders, '', order)) {
            //     orders.push(order);
            // } else {
            //     orderDuplicated = true;
            // }
            _.map(menuItem, (item, index) => {
                if (!item.name) return;
                otherMenu.push({
                    kind: menuIndex,
                    name: item.name,
                    price: item.price,
                    priceUnit: item.priceUnit,
                    content: item.content,
                    sort_order: item.sort_order || 1,
                    category_id: item.category_id,
                    image: item.image || '',
                    is_soldout: item.is_soldout || false,
                    isHidden: sIsHiddenFoodMenu[menuIndex],
                    added : item.added || false,
                    id: item.sid || ''
                });
            });
        });
        executeQuery({
            method: 'put',
            url: `/pub/updatemenu/${this.pubId}`,
            data: {
                mainMenu,
                otherMenu,
                mainCategoryList,
                otherCategoryList
            },
            success: (res) => {
                this.modified = false;
                pushNotification(NOTIFICATION_TYPE_SUCCESS, '성공적으로 저장되었습니다.');

                let {sFetchStatus} = this.state;
                const result = _.get(res, 'pub') || {};
                this.pubId = result.id;
                const mainMenu = result.mainMenu || [];
                const otherMenu = result.otherMenu || [];
                const otherMenuHidden = result.otherMenu_hidden || [];
                // const wineCategoryList = result.wineCategoryList || [];
                // const foodCategoryList = result.foodCategoryList || [];
                let mainMenuGrouped = {};
                let otherMenuGrouped = {};
                let sBeerMenuMode = -1;
                _.map(mainMenu, (menuItem, menuIndex) => {
                    const crrKind = menuItem.kind || '';
                    if (crrKind) {
                        let crrGroupedMenu = mainMenuGrouped[crrKind] || [];
                        crrGroupedMenu.push(menuItem);
                        mainMenuGrouped[crrKind] = crrGroupedMenu;
                        this.mainMenuOrder[crrKind] = {};
                        this.mainMenuOrder[crrKind]["sort_order"] = menuItem.sort_order;
                        this.mainMenuOrder[crrKind]["category_id"] = menuItem.category_id;
                    }
                });
                let isHiddenFoodMenu = {};
                _.map(otherMenu, (menuItem, menuIndex) => {
                    const crrKind = menuItem.kind || '';
                    if (crrKind) {
                        let crrGroupedMenu = otherMenuGrouped[crrKind] || [];
                        crrGroupedMenu.push(menuItem);
                        otherMenuGrouped[crrKind] = crrGroupedMenu;
                        this.otherMenuOrder[crrKind] = {};
                        this.otherMenuOrder[crrKind]["sort_order"] = menuItem.sort_order;
                        this.otherMenuOrder[crrKind]["category_id"] = menuItem.category_id;
                        isHiddenFoodMenu[crrKind] = otherMenuHidden[menuIndex] || false;
                    }
                });

                sFetchStatus.pub = true;
                this.setState({
                    sFetchStatus,
                    sBeerMenuMode: Object.keys(mainMenuGrouped).length > 0 ? 0 : -1,
                    sMainMenu: mainMenuGrouped,
                    sOtherMenu: otherMenuGrouped,
                    sIsHiddenFoodMenu: isHiddenFoodMenu,
                    // sWineCategoryList: wineCategoryList,
                    // sFoodCategoryList: foodCategoryList
                });
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    processRemoveAllMenus = (aType) => {
        let {sMainMenu} = this.state;
        sMainMenu[aType] = [];
        this.setState({
            sMainMenu,
        });
    };

    renderBeerModalImage = (aItem) => {
        return <img src={aItem} alt=''/>
    };

    renderBeerMenuModal = () => {
        const {sIsVisibleBeerMenuModal, sSelectedCapacity} = this.state;
        if (!sIsVisibleBeerMenuModal) return null;
        let image = _.get(this.editBeerMenuItem, 'item.image') || '';
        if (typeof image === 'object') image = '';
        const targetBeers = this.totalBeers;
        let selectedCapacity = [];
        _.map(sSelectedCapacity, (capacityItem, capacityIndex) => {
            const type = this.editBeerMenuItem.type || '';
            if (type.indexOf(capacityItem.kind) > -1) {
                selectedCapacity.push(capacityItem);
            }
        });
        return (
            <Modal
                isOpen={sIsVisibleBeerMenuModal}
                toggle={this.handleToggleBeerMenuModal.bind(this, false)}
                className='modal-beer-menu'
            >
                <ModalHeader
                    toggle={this.handleToggleBeerMenuModal.bind(this, false)}
                    className='modal-beer-menu-header'
                >
                    <h4>{(this.editBeerMenuItem.index || this.editBeerMenuItem.index === 0) ? '메뉴편집' : '메뉴등록'}</h4>
                </ModalHeader>
                <ModalBody className='modal-beer-menu-body'>
                    <div className='modal-beer-menu-body-item'>
                        <div className='modal-item-title'>메뉴명</div>
                        <div className='modal-item-content'>
                            <input
                                name='menu_name'
                                defaultValue={_.get(this.editBeerMenuItem, 'item.menu_name') || ''}
                                onChange={this.handleChangeBeerMenuItem}
                            />
                        </div>
                    </div>
                    <div className='modal-beer-menu-body-item'>
                        <div className='modal-item-title'>가격</div>
                        <div className='modal-item-content'>
                            <MaskedInput
                                name='price'
                                mask={PRICE_MASK}
                                defaultValue={_.get(this.editBeerMenuItem, 'item.price') || ''}
                                onChange={this.handleChangeBeerMenuItem}
                            />
                            원
                        </div>
                    </div>
                    <div className='modal-beer-menu-body-item'>
                        <div className='modal-item-title'>와인</div>
                        <div className='modal-item-content'>
                            <SearchSelect
                                pTitle={{
                                    key: 'name'
                                }}
                                defaultValue={_.get(this.editBeerMenuItem, 'item')}
                                pData={targetBeers}
                                onChange={this.handleSelectBeerItem}
                            />
                        </div>
                    </div>
                    <div className='modal-beer-menu-body-item'>
                        <div className='modal-item-title'>용량</div>
                        <div className='modal-item-content'>
                            <input
                                name='capacity'
                                defaultValue={_.get(this.editBeerMenuItem, 'item.capacity') || ''}
                                onChange={this.handleChangeBeerMenuItem}
                            />
                        </div>
                    </div>
                    <div className='modal-beer-menu-body-item'>
                        <div className='modal-item-title'>사진</div>
                        <div className='modal-item-content'>
                            <form>
                                {image &&
                                <FileList
                                    pFiles={[image]}
                                    downloadAvailable={false}
                                    pHandleDelete={this.handleRemoveModalImage}
                                    pIconCustomRender={this.renderBeerModalImage}
                                />
                                }
                                <FileUpload
                                    url='/files/upload/public'
                                    className='beer-menu-image-fileUpload-dropzone'
                                    ref={ref => {
                                        this.fileUpload = ref;
                                    }}
                                    handleUploadDone={this.handleUploadBeerDone}
                                    pMaxFileCount={1}
                                    pFileFilter={/^(image\/bmp|image\/gif|image\/jpg|image\/jpeg|image\/png)$/i}
                                />
                            </form>
                        </div>
                    </div>
                    
                    {/*<div className='modal-beer-menu-body-item'>*/}
                    {/*    <div className='modal-item-title'>단위</div>*/}
                    {/*    <div className='modal-item-content'>*/}
                    {/*        <input*/}
                    {/*            name='capacityUnit'*/}
                    {/*            defaultValue={_.get(this.editBeerMenuItem, 'item.capacityUnit') || ''}*/}
                    {/*            onChange={this.handleChangeBeerMenuItem}*/}
                    {/*        />*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                    <div className='modal-beer-menu-operation-buttons'>
                        <div className='operation-button' onClick={this.handleSaveBeerMenuItem}>저장</div>
                        <div className='operation-button'
                             onClick={this.handleToggleBeerMenuModal.bind(this, false)}>취소
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        )

    };

    renderFoodModalImage = (aItem) => {
        return <img src={aItem} alt=''/>
    };

    renderEditCategoryModal = () => {
        const {sIsVisibleEditCategoryModal, tempOtherMenu, sIsHiddenFoodMenu} = this.state;
        if (!sIsVisibleEditCategoryModal) return null;
        return (
            <Modal isOpen={sIsVisibleEditCategoryModal}
                   toggle={this.handleToggleEditCategoryModal.bind(this, false)}
                   className='modal-food-menu'>
                <ModalHeader toggle={this.handleToggleEditCategoryModal.bind(this, false)} className='modal-food-menu-header'>
                    <h4>분류관리</h4>
                    <button onClick={() => {this.handleSaveNewFoodKind()}}>분류추가</button>
                </ModalHeader>
                <ModalBody className='modal-food-menu-body'>
                    <table>
                        <thead>
                            <tr>
                                <th width={'15%'}>순서</th>
                                <th width={'60%'}>분류</th>
                                <th width={'15%'}>숨김</th>
                                <th width={'10%'}></th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            _.map(tempOtherMenu, (item, index) => {
                                return (
                                    <tr key={index}>
                                        <td>
                                            <MaskedInput
                                                mask={ORDER_MASK}
                                                className='menu-order-number'
                                                defaultValue={this.otherMenuOrder[index]["sort_order"] || 1}
                                                onChange={this.handleChangeMenuOrder.bind(this, index, 1)}
                                            />
                                        </td>
                                        <td>
                                            <input name='type'
                                                   defaultValue={item[0] ? (item[0].kind || '') : ''}
                                                   onChange={(e) => {this.handleChangeCategory(e, index)}}/>
                                        </td>
                                        <td>
                                            <i className={sIsHiddenFoodMenu[index] ? 'fa fa-check-square-o' : 'fa fa-square-o'}
                                               onClick={this.handleToggleIsHiddenFoodMenu.bind(this, index)}/>
                                        </td>
                                        <td>
                                            <i className='add-delete-new-menu fa fa-trash'
                                               onClick={this.handleRemoveAllFoodMenus.bind(this, index)}/>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                    <div className='modal-food-menu-operation-buttons'>
                        <div className='operation-button' onClick={this.handleSaveCategory.bind(this)}>저장</div>
                        <div className='operation-button'
                             onClick={this.handleToggleEditCategoryModal.bind(this, false)}>취소
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        )
    };

    renderEditMainCategoryModal = () => {
        const {sIsVisibleEditMainCategoryModal, tempMainMenu, sIsHiddenMainMenu} = this.state;
        if (!sIsVisibleEditMainCategoryModal) return null;
        return (
            <Modal isOpen={sIsVisibleEditMainCategoryModal}
                   toggle={this.handleToggleEditMainCategoryModal.bind(this, false)}
                   className='modal-food-menu'>
                <ModalHeader toggle={this.handleToggleEditMainCategoryModal.bind(this, false)} className='modal-food-menu-header'>
                    <h4>분류관리</h4>
                    <button onClick={() => {this.handleSaveNewMainKind()}}>분류추가</button>
                </ModalHeader>
                <ModalBody className='modal-food-menu-body'>
                    <table>
                        <thead>
                        <tr>
                            <th width={'15%'}>순서</th>
                            <th width={'60%'}>분류</th>
                            <th width={'15%'}>숨김</th>
                            <th width={'10%'}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            _.map(tempMainMenu, (item, index) => {
                                return (
                                    <tr key={index}>
                                        <td>
                                            <MaskedInput
                                                mask={ORDER_MASK}
                                                className='menu-order-number'
                                                defaultValue={this.mainMenuOrder[index]["sort_order"] || 1}
                                                onChange={this.handleChangeMenuOrder.bind(this, index, 0)}
                                            />
                                        </td>
                                        <td>
                                            <input name='type'
                                                   defaultValue={item[0] ? (item[0].kind || '') : ''}
                                                   onChange={(e) => {this.handleChangeMainCategory(e, index)}}/>
                                        </td>
                                        <td>
                                            <i className={sIsHiddenMainMenu[index] ? 'fa fa-check-square-o' : 'fa fa-square-o'}
                                               onClick={this.handleToggleIsHiddenMainMenu.bind(this, index)}/>
                                        </td>
                                        <td>
                                            <i className='add-delete-new-menu fa fa-trash'
                                               onClick={this.handleRemoveAllMainMenus.bind(this, index)}/>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                    <div className='modal-food-menu-operation-buttons'>
                        <div className='operation-button' onClick={this.handleSaveMainCategory.bind(this)}>저장</div>
                        <div className='operation-button'
                             onClick={this.handleToggleEditMainCategoryModal.bind(this, false)}>취소
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        )
    };

    renderFoodMenuModal = () => {
        const {sIsVisibleFoodMenuModal} = this.state;
        if (!sIsVisibleFoodMenuModal) return null;
        let image = _.get(this.editFoodMenuItem, 'item.image') || '';
        let content = _.get(this.editFoodMenuItem, 'item.content') || '';
        if (typeof image === 'object') image = '';
        if (typeof content === 'object') content = '';
        return (
            <Modal
                isOpen={sIsVisibleFoodMenuModal}
                toggle={this.handleToggleFoodMenuModal.bind(this, false)}
                className='modal-food-menu'
            >
                <ModalHeader
                    toggle={this.handleToggleFoodMenuModal.bind(this, false)}
                    className='modal-food-menu-header'
                >
                    <h4>{(this.editFoodMenuItem.index || this.editFoodMenuItem.index === 0) ? '메뉴편집' : '메뉴등록'}</h4>
                </ModalHeader>
                <ModalBody className='modal-food-menu-body'>
                    <div className='modal-food-menu-body-item'>
                        <div className='modal-item-title'>메뉴명</div>
                        <div className='modal-item-content'>
                            <input
                                name='name'
                                defaultValue={_.get(this.editFoodMenuItem, 'item.name') || ''}
                                onChange={this.handleChangeFoodMenuItem}
                            />
                        </div>
                    </div>
                    <div className='modal-food-menu-body-item'>
                        <div className='modal-item-title'>가격</div>
                        <div className='modal-item-content'>
                            <MaskedInput
                                name='price'
                                mask={PRICE_MASK}
                                defaultValue={_.get(this.editFoodMenuItem, 'item.price') || ''}
                                onChange={this.handleChangeFoodMenuItem}
                            />
                            원
                        </div>
                    </div>
                    <div className='modal-food-menu-body-item'>
                        <div className='modal-item-title'>설명</div>
                        <div className='modal-item-content'>
                            <textarea
                                name='content'
                                defaultValue={content}
                                onChange={this.handleChangeFoodMenuItem}
                            />
                        </div>
                    </div>
                    <div className='modal-food-menu-body-item'>
                        <div className='modal-item-title'>사진</div>
                        <div className='modal-item-content'>
                            <form>
                                {image &&
                                <FileList
                                    pFiles={[image]}
                                    downloadAvailable={false}
                                    pHandleDelete={this.handleRemoveModalImage}
                                    pIconCustomRender={this.renderFoodModalImage}
                                />
                                }
                                <FileUpload
                                    url='/files/upload/public'
                                    className='food-menu-image-fileUpload-dropzone'
                                    ref={ref => {
                                        this.fileUpload = ref;
                                    }}
                                    handleUploadDone={this.handleUploadDone}
                                    pMaxFileCount={1}
                                    pFileFilter={/^(image\/bmp|image\/gif|image\/jpg|image\/jpeg|image\/png)$/i}
                                />
                            </form>
                        </div>
                    </div>
                    <div className='modal-food-menu-operation-buttons'>
                        <div className='operation-button' onClick={this.handleSaveFoodMenuItem}>저장</div>
                        <div className='operation-button'
                             onClick={this.handleToggleFoodMenuModal.bind(this, false)}>취소
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        )
    };

    renderMenuType = (aType, aLength) => {
        return (
            <td rowSpan={aLength || 1}>
                {aType}
                <i className='add-delete-new-menu fa fa-trash' onClick={this.handleRemoveAllMenus.bind(this, aType)}/>
                <i className='add-delete-new-menu fa fa-plus'
                   onClick={this.handleAddNewBeerMenuItem.bind(this, aType)}/>
            </td>
        );
    };

    // renderMenuOrder = (aType, aLength) => {
    //     return (
    //         <td rowSpan={aLength || 1}>
    //             <MaskedInput
    //                 mask={ORDER_MASK}
    //                 className='menu-order-number'
    //                 defaultValue={this.menuOrder[aType] || 1}
    //                 onChange={this.handleChangeMenuOrder.bind(this, aType)}
    //             />
    //         </td>
    //     );
    // };

    selectBeerMenuTab(val) {
        this.setState({sBeerMenuMode: val})
    }
    selectFoodMenuTab(val) {
        this.setState({sFoodMenuMode: val})
    }

    renderBeerMenuTr = (aItem, aIndex, menuIndex) => {
        return (
            <table className={'beer-menu-table'} key={menuIndex}>
                <thead>
                <tr>
                    <th width={'22.5%'}>메뉴명</th>
                    <th width={'22.5%'}>가격</th>
                    <th width={'22.5%'}>와인</th>
                    <th width={'22.5%'}>용량</th>
                    <th width={'10%'}></th>
                </tr>
                </thead>
                <tbody>
                {
                    !aItem || aItem.length === 0 || aItem[0].isNew && (
                        <tr>
                            <td colSpan='5'>등록된 메뉴가 없습니다.</td>
                        </tr>
                    )
                }
                {
                    !(!aItem || aItem.length === 0 || aItem[0].isNew) &&
                    _.map(aItem, (menuItem, menuIndex) => {
                        return (
                            <tr key={`${menuItem.id}-${menuIndex}`}>
                                <td onClick={this.handleEditMenuItem.bind(this, aIndex, menuItem, menuIndex)} className={'pointer'}>{menuItem.menu_name || ''}</td>
                                <td>{`${maskNumber(menuItem.price || '') || 0}${menuItem.priceUnit}`}</td>
                                <td>{_.get(menuItem, 'name') || ''}</td>
                                <td>{`${maskNumber(menuItem.capacity || '') || 0}`}</td>
                                <td>
                                    <i className='fa fa-trash'
                                       onClick={this.handleRemoveMenuItem.bind(this, aIndex, menuIndex)}/>
                                </td>
                            </tr>
                        )
                    })
                }
                </tbody>
            </table>
        );
    };

    renderBeerMenuTable = () => {
        const {sMainMenu, sBeerMenuMode} = this.state;
        const sortedMenu = _.sortBy(sMainMenu, [function (menuItem) {
            return _.get(menuItem, '[0].sort_order') || 0;
        }]);
        return (
            <div className={'tab-container'}>
                <div className={'tabs'}>
                    <div className={'tab-title'}>
                        분류
                    </div>
                    {_.map(sortedMenu, (menuItem, menuIndex) => {
                        const kind = _.get(menuItem, '[0].kind') || '';
                        return (
                            <div key={menuIndex} className={cn('tab-menu-item', sBeerMenuMode === menuIndex && 'active')} onClick={() => {this.selectBeerMenuTab(menuIndex)}}>
                                {kind}
                            </div>
                        );
                    })}
                </div>
                <div className={'tab-content'}>
                    {_.map(sortedMenu, (menuItem, menuIndex) => {
                        const kind = _.get(menuItem, '[0].kind') || '';
                        if (menuIndex === sBeerMenuMode) {
                            return this.renderBeerMenuTr(menuItem, kind, menuIndex);
                        }
                    })}
                </div>
            </div>
        )
    };

    renderFoodMenuTr = (aItem, aIndex, menuIndex) => {
        return (
            <table className={'beer-menu-table'} key={menuIndex}>
                <thead>
                <tr>
                    <th width={'22.5%'}>메뉴명</th>
                    <th width={'22.5%'}>가격</th>
                    <th width={'22.5%'}>설명</th>
                    <th width={'22.5%'}>사진</th>
                    <th width={'10%'}></th>
                </tr>
                </thead>
                <tbody>
                {
                    !aItem || aItem.length === 0 || aItem[0].isNew && (
                        <tr>
                            <td colSpan='5'>등록된 메뉴가 없습니다.</td>
                        </tr>
                    )
                }
                {
                    !(!aItem || aItem.length === 0 || aItem[0].isNew) &&
                    _.map(aItem, (item, index) => {
                        return (
                            <tr key={`${aIndex}-${index}`}>
                                <td onClick={this.handleEditFoodMenuItem.bind(this, aIndex, item, index)} className={'pointer'}>{item.name || ''}</td>
                                <td>{`${maskNumber(item.price || '') || 0}${item.priceUnit || ''}`}</td>
                                <td><pre>
                                    {item.content || ''}</pre>
                                </td>
                                <td>{item.image ? <img src={item.image} alt='' style={{width: '40px', height: '40px', borderRadius: '5px'}}/> : ''}</td>
                                <td>
                                    <i className='fa fa-trash' onClick={this.handleRemoveFoodMenuItem.bind(this, aIndex, index)}/>
                                </td>
                            </tr>
                        )
                    })
                }
                </tbody>
            </table>
        );
    };

    renderFoodMenuTable = () => {
        const {sOtherMenu, sFoodMenuMode} = this.state;
        const sortedMenu = _.sortBy(sOtherMenu, [function (menuItem) {
            return _.get(menuItem, '[0].sort_order') || 0;
        }]);

        return (
            <div className={'tab-container'}>
                <div className={'tabs'}>
                    <div className={'tab-title'}>
                        분류
                    </div>
                    {_.map(sortedMenu, (menuItem, menuIndex) => {
                        const kind = _.get(menuItem, '[0].kind') || '';
                        return (
                            <div key={menuIndex} className={cn('tab-menu-item', sFoodMenuMode === menuIndex && 'active')} onClick={() => {this.selectFoodMenuTab(menuIndex)}}>
                                {kind}
                            </div>
                        );
                    })}
                </div>
                <div className={'tab-content'}>
                    {_.map(sortedMenu, (menuItem, menuIndex) => {
                        const kind = _.get(menuItem, '[0].kind') || '';
                        if (menuIndex === sFoodMenuMode) {
                            return this.renderFoodMenuTr(menuItem, kind, menuIndex);
                        }
                    })}

                </div>
            </div>
        )
    };

    render() {
        const {sFetchStatus, sIsShowNewFoodKind} = this.state;
        if (sFetchStatus.beer && sFetchStatus.pub) {
            return (
                <div className='container-page-seller-menu'>
                    <div className='menu-table-container'>
                        <div className='menu-table-header'>
                            <div className='menu-table-title'>Wine</div>
                            <div className='right-buttons'>
                                <button onClick={() => {this.handleAddNewMainKind()}}>분류관리</button>
                                <button onClick={() => {this.handleAddNewBeerMenuItem()}}>추가</button>
                            </div>
                        </div>
                        {this.renderBeerMenuTable()}
                    </div>
                    <div className='menu-table-container'>
                        <div className='menu-table-header'>
                            <div className='menu-table-title'>Menu</div>
                            <div className='right-buttons'>
                                <button onClick={() => {this.handleAddNewFoodKind()}}>분류관리</button>
                                <button onClick={() => {this.handleAddNewFoodMenuItem()}}>추가</button>
                            </div>
                            {sIsShowNewFoodKind &&
                            <div className='new-food-kind-inputer'>
                                <input onChange={this.handleChangeNewFoodKind}/>
                                <div className='new-food-kind-inputer-buttons'>
                                    <div className='save-new-food-kind' onClick={this.handleSaveNewFoodKind}>저장</div>
                                    <div className='cancel-new-food-kind' onClick={this.handleCancelNewFoodKind}>취소
                                    </div>
                                </div>
                            </div>
                            }
                        </div>
                        {this.renderFoodMenuTable()}
                    </div>
                    <div className='seller-menu-save-button-container'>
                        <div className='seller-menu-save-button' onClick={this.handleSaveSellerMenu}>저장</div>
                    </div>
                    {this.renderBeerMenuModal()}
                    {this.renderFoodMenuModal()}
                    {this.renderEditCategoryModal()}
                    {this.renderEditMainCategoryModal()}
                </div>
            );
        } else {
            return (
                <div className='loading-wrapper'>
                    <Loading/>
                </div>
            );
        }
    }
}

SellerMenu.propTypes = {};

SellerMenu.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
        }),
    )
)(SellerMenu);
