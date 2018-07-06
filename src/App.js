import React, {Component} from 'react';
import {Card, Container, Dimmer, Grid, Header, Icon, List, Loader, Message, Popup, Statistic} from "semantic-ui-react";
import Moment from "react-moment";

const API_URL = "http://localhost:8080/v1";

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            date: new Date(),
            ticker: null,
            settings: {
                refresh_interval: 10000,
                inactive_settings: {
                    author: '',
                    description: '',
                    email: '',
                    headline: '',
                    homepage: '',
                    sub_headline: '',
                    twitter: '',
                },
            },
            messages: [],
            isLoading: true,
            isFetching: false,
            showReloadInfo: true,
        };

        this.handleReloadInfoDismiss = this.handleReloadInfoDismiss.bind(this);
        this.fetchMessages = this.fetchMessages.bind(this);
        this.fetchOlderMessages = this.fetchOlderMessages.bind(this);
    }

    componentWillMount() {
        fetch(`${API_URL}/init`)
            .then(response => response.json())
            .then(response => {
                if (response.data !== undefined && response.data.settings !== undefined) {
                    this.setState({settings: response.data.settings});
                }
                if (response.data !== undefined && response.data.ticker !== null && response.data.ticker.active) {
                    this.setState({ticker: response.data.ticker});

                    if (this.state.ticker.active) {
                        this.fetchMessages();

                        this.fetchID = setInterval(
                            () => this.fetchMessages(),
                            this.state.settings.refresh_interval
                        );
                    }
                }

                this.setState({isLoading: false});
            });
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.tick(),
            1000
        );

        document.addEventListener('scroll', this.fetchOlderMessages);
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
        clearInterval(this.fetchID);
    }

    static replaceMagic(text) {
        return (text
            .replace(/(https?:\/\/([^\s]+))/g, '<a href="$1" target="_blank">$2</a>')
            .replace(/#(\S+)/g, '<a target="_blank" href="https://twitter.com/search?q=%23$1">#$1</a>')
            .replace(/@(\S+)/g, '<a target="_blank" href="https://twitter.com/$1">@$1</a>')
            .replace(/(?:\r\n|\r|\n)/g, '<br/>'));
    }

    fetchOlderMessages() {
        const root = document.getElementById('root');

        if (root.getBoundingClientRect().bottom <= window.innerHeight) {
            let message = this.state.messages[this.state.messages.length - 1];

            if (message !== undefined) {
                fetch(`${API_URL}/timeline?before=${message.id}`)
                    .then(response => response.json())
                    .then(response => {
                        if (response.data !== undefined && response.data.messages !== null) {
                            this.setState({messages: this.state.messages.concat(response.data.messages)});
                        }
                    });
            }
        }
    }

    fetchMessages() {
        this.setState({isFetching: true});

        if (this.state.messages[0] !== undefined) {
            let after = this.state.messages[0].id;

            if (after !== undefined) {
                fetch(`${API_URL}/timeline?after=${after}`)
                    .then(response => response.json())
                    .then(response => {
                        if (response.data !== undefined && response.data.messages !== null) {
                            this.setState({messages: response.data.messages.concat(this.state.messages)});
                        }
                    });
            }
        } else {
            fetch(`${API_URL}/timeline`)
                .then(response => response.json())
                .then(response => {
                    if (response.data !== undefined && response.data.messages !== null) {
                        this.setState({messages: response.data.messages});
                    }
                });
        }

        this.setState({isFetching: false});
    }

    tick() {
        this.setState({
            date: new Date()
        });
    }

    handleReloadInfoDismiss() {
        this.setState({showReloadInfo: false});
    }

    renderMessages() {
        if (this.state.messages === undefined || this.state.messages.length === 0) {
            return;
        }

        const messages = this.state.messages;

        return (
            <Container>
                <Message
                    color='teal' icon='info'
                    onDismiss={this.handleReloadInfoDismiss}
                    header='Information'
                    content='The messages updates automatically. There is no need to reload the entire page.'
                />
                <Container textAlign='right'>
                    <Loader inline active={this.state.isFetching} size='tiny'/>
                </Container>
                {messages.map(message =>
                    <Card key={message.id} fluid>
                        <Card.Content><div dangerouslySetInnerHTML={{__html: App.replaceMagic(message.text)}}/></Card.Content>
                        <Card.Content extra>
                            <Card.Meta>
                                <Popup
                                    flowing inverted
                                    size='tiny'
                                    trigger={<div><Icon name='clock'/><span className='date'><Moment fromNow
                                                                                                     date={message.creation_date}/></span>
                                    </div>}
                                    content={<Moment date={message.creation_date}/>}
                                />
                            </Card.Meta>
                        </Card.Content>
                    </Card>
                )}
            </Container>
        );
    }

    renderTicker() {
        if (this.state.ticker === null || this.state.ticker.id === undefined) {
            return;
        }

        return (
            <Card fluid>
                <Card.Content header={this.state.ticker.title}/>
                <Card.Content content={this.state.ticker.description}/>
                <Card.Content>
                    <Header size='small'>Informationen</Header>
                    <List>
                        {this.renderAuthorItem()}
                        {this.renderEmailItem()}
                        {this.renderHomepageItem()}
                        {this.renderTwitterItem()}
                        {this.renderFacebookItem()}
                    </List>
                </Card.Content>
            </Card>
        );
    }

    renderAuthorItem() {
        if (!this.state.ticker.information.author) {
            return;
        }

        return (
            <List.Item>
                <List.Icon name='users'/>
                <List.Content>{this.state.ticker.information.author}</List.Content>
            </List.Item>
        );
    }

    renderEmailItem() {
        if (!this.state.ticker.information.email) {
            return;
        }

        return (
            <List.Item>
                <List.Icon name='mail'/>
                <List.Content><a
                    target='_blank'
                    rel='noopener noreferrer'
                    href={`mailto:${this.state.ticker.information.email}`}>{this.state.ticker.information.email}</a></List.Content>
            </List.Item>
        );
    }

    renderHomepageItem() {
        if (!this.state.ticker.information.url) {
            return;
        }

        return (
            <List.Item>
                <List.Icon name='linkify'/>
                <List.Content><a
                    target='_blank'
                    rel='noopener noreferrer'
                    href={`${this.state.ticker.information.url}`}>{this.state.ticker.information.url.replace(/http[s]:\/\/?/, '')}</a></List.Content>
            </List.Item>
        );
    }

    renderTwitterItem() {
        if (!this.state.ticker.information.twitter) {
            return;
        }

        return (
            <List.Item>
                <List.Icon name='twitter'/>
                <List.Content><a
                    target='_blank'
                    rel='noopener noreferrer'
                    href={`https://twitter.com/${this.state.ticker.information.twitter}`}>@{this.state.ticker.information.twitter}</a></List.Content>
            </List.Item>
        );
    }

    renderFacebookItem() {
        if (!this.state.ticker.information.facebook) {
            return;
        }

        return (
            <List.Item>
                <List.Icon name='facebook'/>
                <List.Content><a
                    target='_blank'
                    rel='noopener noreferrer'
                    href={`https://fb.com/${this.state.ticker.information.facebook}`}>fb.com/{this.state.ticker.information.facebook}</a></List.Content>
            </List.Item>
        );
    }

    renderClock() {
        return (
            <Container textAlign='center'>
                <Statistic>
                    <Statistic.Value>{this.state.date.toLocaleTimeString()}</Statistic.Value>
                    <Statistic.Label><Moment date={this.state.date} format='dddd, DD. MMMM YYYY'/></Statistic.Label>
                </Statistic>
            </Container>
        );
    }

    renderCredits() {
        return (
            <Container textAlign='right' style={{color: 'rgba(0, 0, 0, .5)'}}>
                <Icon name='code'/> with <Icon name='heart' color='red'/> by <a href='https://www.systemli.org'
                                                                                target='_blank'
                                                                                rel='noopener noreferrer'>systemli.org</a>
            </Container>
        );
    }

    renderActiveMode() {
        return (
            <Container style={{paddingTop: 50}}>
                <Dimmer active={this.state.isLoading} page>
                    <Loader size='huge' content='Initializing...'/>
                </Dimmer>
                <Grid>
                    <Grid.Column width={10}>
                        {this.renderMessages()}
                    </Grid.Column>
                    <Grid.Column width={6}>
                        {this.renderClock()}
                        {this.renderTicker()}
                        {this.renderCredits()}
                    </Grid.Column>
                </Grid>
            </Container>
        );
    }

    renderInactiveMode() {
        const authorItem = (this.state.settings.inactive_settings.author) ? <List.Item>
            <List.Icon name='users'/>
            <List.Content>{this.state.settings.inactive_settings.author}</List.Content>
        </List.Item> : '';

        const emailItem = (this.state.settings.inactive_settings.email) ? <List.Item>
            <List.Icon name='mail'/>
            <List.Content><a
                href={'mailto:' + this.state.settings.inactive_settings.email}>Email</a></List.Content>
        </List.Item> : '';

        const homepageItem = (this.state.settings.inactive_settings.homepage) ? <List.Item>
            <List.Icon name='linkify'/>
            <List.Content><a href={this.state.settings.inactive_settings.homepage}>Homepage</a></List.Content>
        </List.Item> : '';

        const twitterItem = (this.state.settings.inactive_settings.twitter) ? <List.Item>
            <List.Icon name='twitter'/>
            <List.Content><a
                href={'https://twitter.com/' + this.state.settings.inactive_settings.twitter}>@{this.state.settings.inactive_settings.twitter}</a></List.Content>
        </List.Item> : '';

        return (
            <Container style={{paddingTop: 50}}>
                <Grid centered>
                    <Grid.Column width={8}>
                        <Header size='huge' icon textAlign='center'>
                            <Icon name='hide'/>
                            <Header.Content>
                                {this.state.settings.inactive_settings.headline}
                                <Header.Subheader>
                                    {this.state.settings.inactive_settings.sub_headline}
                                </Header.Subheader>
                            </Header.Content>
                        </Header>
                        <Card fluid>
                            <Card.Content>
                                {this.state.settings.inactive_settings.description}
                            </Card.Content>
                            <Card.Content>
                                <Header size='small'>Information</Header>
                                <List>
                                    {authorItem}
                                    {emailItem}
                                    {homepageItem}
                                    {twitterItem}
                                </List>
                            </Card.Content>
                        </Card>
                        {this.renderCredits()}
                    </Grid.Column>
                </Grid>
            </Container>
        );
    }

    render() {
        if (this.state.ticker !== null && this.state.ticker.active) {
            return this.renderActiveMode();
        }

        return this.renderInactiveMode();
    }
}

export default App;