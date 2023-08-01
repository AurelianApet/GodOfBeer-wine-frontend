import React, {Component} from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

class BeerFilterSort extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sSortDirection: 'asc',
            sFilterArray: [],
            selectedFilter: {}
        };
        this.filterWord = {};
        this.sortValue = ''
    }

    componentDidMount() {
        this.getFilterData(this.props);
    }

    componentWillReceiveProps(newProps) {
        this.getFilterData(newProps);
    }

    getFilterData = (aProps) => {
        const {pFilterArray} = aProps;
        const filterArray = [];
        _.map(pFilterArray, (filterItem, filterIndex) => {
            const itemArray = [];
            _.map(filterItem.values, (item, index) => {
                if (typeof item !== 'object') {
                    itemArray.push({value: item, title: item});
                } else {
                    itemArray.push(item);
                }
            });
            filterArray.push({title: filterItem.title, fieldName: filterItem.fieldName, values: itemArray})
        });
        this.setState({sFilterArray: filterArray});
    };

    handleFilter = (value, fieldItem, e) => {
        let options = this.state.selectedFilter[fieldItem.fieldName];
        if (!options) options = [];
        let optionValue = '';
        _.map(fieldItem.values, (item, index) => {
            if (item.value === Number(e.target.value)) {
                optionValue = _.get(item, 'option') || '';
            }
        });
        if (e.target.checked) {
            options.push({
                option: optionValue,
                value: e.target.value
            })
        } else {
            for (let i = 0; i < options.length; i ++) {
                if (options[i].value === e.target.value) {
                    options.splice(i, 1);
                    break;
                }
            }
        }

        let selectedFilter = {...this.state.selectedFilter};
        selectedFilter[fieldItem.fieldName] = options;

        this.setState({selectedFilter: selectedFilter});
        this.handleFilterArray(selectedFilter);
    };

    handleSort = (e) => {
        if (!e) {
            return;
        }
        this.sortValue = e.target.value;
        this.handleDataSort();
    };

    handleSortDirection = () => {
        const {sSortDirection} = this.state;
        let aSortIcon = sSortDirection === 'asc' ? 'desc' : 'asc';
        this.setState({
            sSortDirection: aSortIcon
        }, () => {
            this.handleDataSort();
        })
    };

    handleDataSort = () => {
        const {sSortDirection} = this.state;
        const {pData, pHandleDataArray, pSortArray} = this.props;
        let aDataType = 'string';
        let aDataSortArray = [];
        if (this.sortValue === 'noSort') {
            aDataSortArray = pData;
        } else {
            _.map(pSortArray, (item) => {
                if (!!item.type && item.fieldName === this.sortValue) {
                    aDataType = item.type;
                }
            });
            _.map(pData, (item) => {
                if (aDataType === 'number' && typeof (item[this.sortValue]) === 'string') {
                    item[this.sortValue] = Number(item[this.sortValue]);
                }
            });
            aDataSortArray = _.orderBy(pData, [this.sortValue], [sSortDirection]);
        }
        pHandleDataArray(aDataSortArray);
    };

    handleFilterArray = (selectedFilter) => {
        const {pData, pHandleDataArray} = this.props;

        let aDataFilterArray = [];
        let indexArray = [];
        let isFilter = false;

        for (let i = 0; i < Object.keys(selectedFilter).length; i ++) {
            let filterIndex = Object.keys(selectedFilter)[i];

            for (let j = 0; j < selectedFilter[filterIndex].length; j ++) {
                let filterOption = selectedFilter[filterIndex][j].option;
                let filterItem = selectedFilter[filterIndex][j].value;
                isFilter = true;

                console.log(filterIndex, filterOption, filterItem);
                _.map(pData, (dataItem, itemIndex) => {
                    let visible = true;
                    if (filterItem !== 'all' && filterItem) {
                        visible = visible && (filterOption === 'st' ? _.get(dataItem, filterIndex) < filterItem
                            : filterOption === 'ste' ? _.get(dataItem, filterIndex) <= filterItem
                                : filterOption === 'lt' ? _.get(dataItem, filterIndex) > filterItem
                                    : filterOption === 'lte' ? _.get(dataItem, filterIndex) >= filterItem
                                        : (_.get(dataItem, filterIndex) || '').indexOf(filterItem) > -1)
                    }
                    if (visible && indexArray.indexOf(itemIndex) < 0) {
                        indexArray.push(itemIndex);
                    }
                });
            }
        }

        if (isFilter) {
            _.map(pData, (dataItem, itemIndex) => {
                if (indexArray.indexOf(itemIndex) >= 0) {
                    aDataFilterArray.push(dataItem);
                }
            });
        } else {
            aDataFilterArray = pData;
        }


        pHandleDataArray(aDataFilterArray);
    };

    renderFilterForm = () => {
        const {sFilterArray} = this.state;
        return (
            <div className='filter-body'>
                {
                    _.map(sFilterArray, (filterItem, itemIndex) => {
                        return (
                            <div key={`${filterItem.title} ${filterItem.fieldName}`} className='filter-item'>
                                <div className="dropdown">
                                    <button className="btn btn-default dropdown-toggle" type="button" id="menu1"
                                            data-toggle="dropdown">
                                        {`${filterItem.title} `} 필터
                                    </button>
                                    <ul className="dropdown-menu" role="menu" aria-labelledby="menu1">
                                        <li className="title">와인 {`${filterItem.title} `} (복수 선택 가능)</li>
                                        {
                                            _.map(filterItem.values, (filter, index) => {
                                                return (
                                                    <li role="presentation">
                                                        <input type="checkbox" className="form-control" onClick={(e) => {
                                                            this.handleFilter(filter.value, filterItem, e)
                                                        }} value={filter.value}/>
                                                        <label>{filter.title}</label>
                                                    </li>
                                                )
                                            })
                                        }

                                    </ul>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        )
    };

    renderSortForm = () => {
        const {sSortDirection} = this.state;
        const {pSortArray} = this.props;
        return (
            <div className='sort-body'>
                <div className="sort-option-title">
                    <span>{'정렬:'}</span>
                    <select onChange={this.handleSort}>
                        <option value='noSort'>표준</option>
                        {
                            _.map(pSortArray, (sortItem, index) => {
                                return (
                                    <option key={`${sortItem.fieldName}-${index}-fliter`}
                                            value={sortItem.fieldName}>{sortItem.title}</option>
                                )
                            })
                        }
                    </select>
                </div>
                <div className='sort-direction' onClick={this.handleSortDirection}>
                    <i className={`fa fa-sort-${sSortDirection}`}></i>
                </div>
            </div>
        )
    };

    render() {
        return (
            <div className='container-beer-filter-sort-body'>
                {this.renderFilterForm()}
                {this.renderSortForm()}
            </div>
        );
    }
}

BeerFilterSort.propTypes = {
    pData: PropTypes.array,
    pSortArray: PropTypes.array,
    pFilterArray: PropTypes.array,
    pHandleDataArray: PropTypes.func,
};

BeerFilterSort.defaultProps = {
    pData: [],
    pSortArray: [],
    pFilterArray: [],
    pHandleDataArray: () => {
    },
};

export default BeerFilterSort